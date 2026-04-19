import { create } from 'zustand';
import Peer, { type DataConnection } from 'peerjs';
import { useTestStore } from './testStore';
import type { TestConfig } from '../types/test';

export interface ParticipantData {
  id: string;
  name: string;
  status: 'lobby' | 'active' | 'finished';
  score?: number;
  maxScore?: number;
}

const compressPayload = async (obj: unknown): Promise<ArrayBuffer> => {
  const jsonString = JSON.stringify(obj);
  const jsonBytes = new TextEncoder().encode(jsonString);
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(jsonBytes);
  writer.close();
  return new Response(cs.readable).arrayBuffer();
};

const decompressPayload = async (buffer: ArrayBuffer | Uint8Array): Promise<any> => {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(new Uint8Array(buffer));
  writer.close();
  const ab = await new Response(ds.readable).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(ab));
};

const getPeerConfig = () => {
  const username = import.meta.env.VITE_TURN_USERNAME || '';
  const credential = import.meta.env.VITE_TURN_CREDENTIAL || '';

  return { 
    config: { 
      iceServers: [
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:global.relay.metered.ca:80",
          username,
          credential,
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username,
          credential,
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username,
          credential,
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username,
          credential,
        },
      ]
    } 
  };
};

export type SyncAction =
  | { type: 'TEST_START'; config: TestConfig }
  | { type: 'USER_JOIN'; peerId: string; name: string }
  | { type: 'USER_FINISH'; peerId: string; score: number; maxScore: number }
  | { type: 'USER_LEAVE'; peerId: string }
  | { type: 'SYNC_LOBBY_STATE'; participantsData: Record<string, ParticipantData> };

interface SyncState {
  peer: Peer | null;
  roomId: string | null;
  role: 'host' | 'client' | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  connections: DataConnection[];
  
  userName: string;
  participantsData: Record<string, ParticipantData>;
  isIncomingSync: boolean;

  setUserName: (name: string) => void;
  hostRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  broadcastAction: (action: SyncAction) => void;
  handleIncomingAction: (action: SyncAction) => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  peer: null,
  roomId: null,
  role: null,
  status: 'disconnected',
  error: null,
  connections: [],
  userName: '',
  participantsData: {},
  isIncomingSync: false,

  setUserName: (name) => set({ userName: name }),

  hostRoom: () => {
    set({ status: 'connecting', error: null });
    
    const shortCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const fullRoomId = `revise-room-${shortCode}`;
    
    const peerConfig = getPeerConfig();
    const peer = new Peer(fullRoomId, peerConfig);

    peer.on('open', (id) => {
      const initData: ParticipantData = { id, name: get().userName, status: 'lobby' };
      set({ 
        peer, 
        roomId: shortCode, 
        role: 'host', 
        status: 'connected', 
        participantsData: { [id]: initData } 
      });
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        set((state) => ({
          connections: [...state.connections, conn]
        }));

        // Instantly send the full room state to the new client
        compressPayload({ 
          type: 'SYNC_LOBBY_STATE', 
          participantsData: get().participantsData 
        }).then(buf => conn.send(buf));

        // If the host already picked a config, send it to the new joined room user
        const testStore = useTestStore.getState();
        if (testStore.config) {
          compressPayload({ type: 'TEST_START', config: testStore.config }).then(buf => conn.send(buf));
        }
      });

      conn.on('data', async (data: any) => {
        let action: SyncAction;
        if (data instanceof ArrayBuffer || (data && typeof data.byteLength === 'number')) {
            try { 
              action = await decompressPayload(data); 
            } catch (e) {
              console.error("Failed to decompress host packet", e);
              return; 
            }
        } else {
            action = data as SyncAction;
        }

        get().handleIncomingAction(action);
        
        // Host acts as relay network to all other clients
        const state = get();
        state.connections.forEach(c => {
          // Send raw received data buffer explicitly to avoid re-compressing locally! Massively saves CPU/Bandwidth.
          if (c !== conn) c.send(data); 
        });
      });

      conn.on('close', () => {
        set((state) => ({
          connections: state.connections.filter((c) => c !== conn),
        }));
        
        const leaveAction: SyncAction = { type: 'USER_LEAVE', peerId: conn.peer };
        get().handleIncomingAction(leaveAction);
        get().broadcastAction(leaveAction);
      });
    });

    peer.on('error', (err) => {
      set({ status: 'error', error: err.message });
    });
  },

  joinRoom: (shortCode: string) => {
    set({ status: 'connecting', error: null });
    const roomId = shortCode.toUpperCase();
    const fullRoomId = `revise-room-${roomId}`;
    
    const peerConfig = getPeerConfig();
    const peer = new Peer(peerConfig);

    peer.on('open', (id) => {
      const conn = peer.connect(fullRoomId);
      
      conn.on('open', () => {
        const initData: ParticipantData = { id, name: get().userName, status: 'lobby' };
        set(s => ({
          peer,
          roomId,
          role: 'client',
          status: 'connected',
          connections: [conn],
          participantsData: { ...s.participantsData, [id]: initData }
        }));
        
        // Notify host that we joined
        compressPayload({ type: 'USER_JOIN', peerId: id, name: get().userName }).then(buf => conn.send(buf));
      });

      conn.on('data', async (data: any) => {
         let action: SyncAction;
         if (data instanceof ArrayBuffer || (data && typeof data.byteLength === 'number')) {
             try { 
               action = await decompressPayload(data); 
             } catch (e) {
               console.error("Failed to decompress client packet", e);
               return; 
             }
         } else {
             action = data as SyncAction;
         }
         get().handleIncomingAction(action);
      });

      conn.on('close', () => {
         get().leaveRoom();
         set({ error: 'Host disconnected.'});
      });

      peer.on('error', (err) => {
         set({ status: 'error', error: err.message });
      });
    });
  },

  leaveRoom: () => {
    const { peer } = get();
    if (peer) peer.destroy();
    set({
      peer: null,
      roomId: null,
      role: null,
      status: 'disconnected',
      connections: [],
      participantsData: {},
      error: null
    });
  },

  broadcastAction: async (action) => {
    const { connections } = get();
    if (connections.length === 0) return;
    try {
      const compressed = await compressPayload(action);
      connections.forEach((conn) => conn.send(compressed));
    } catch {
      connections.forEach((conn) => conn.send(action)); // Fallback
    }
  },

  handleIncomingAction: (action) => {
     set({ isIncomingSync: true });
     try {
       switch (action.type) {
         case 'TEST_START':
           useTestStore.getState().setConfig(action.config);
           set(s => {
             const pd = { ...s.participantsData };
             Object.keys(pd).forEach(k => { pd[k] = { ...pd[k], status: 'active' } });
             return { participantsData: pd };
           });
           break;
           
         case 'USER_JOIN':
           set(s => ({
             participantsData: { 
               ...s.participantsData, 
               [action.peerId]: { id: action.peerId, name: action.name, status: 'lobby' } 
             }
           }));
           break;
           
         case 'USER_FINISH':
           set(s => {
             const updated = { ...s.participantsData };
             if (updated[action.peerId]) {
               updated[action.peerId] = { 
                 ...updated[action.peerId], 
                 status: 'finished', 
                 score: action.score, 
                 maxScore: action.maxScore 
               };
             }
             return { participantsData: updated };
           });
           break;
           
         case 'USER_LEAVE':
           set(s => {
             const pd = { ...s.participantsData };
             delete pd[action.peerId];
             return { participantsData: pd };
           });
           break;
           
         case 'SYNC_LOBBY_STATE':
           // Merge so we don't accidentally overwrite/delete our own local 'id' entry added during join
           set(s => ({ participantsData: { ...s.participantsData, ...action.participantsData } }));
           break;
       }
     } finally {
       setTimeout(() => set({ isIncomingSync: false }), 50);
     }
  }
}));

// Setup subscription to testStore to auto-broadcast changes without circular dependencies
useTestStore.subscribe((state, prevState) => {
  const syncState = useSyncStore.getState();
  
  if (syncState.isIncomingSync || syncState.connections.length === 0) return;

  // HOST: Broadcast TEST_START when loading a test for the room
  if (state.config && state.config !== prevState.config && syncState.role === 'host') {
    syncState.broadcastAction({ type: 'TEST_START', config: state.config });
    // Host transitions everyone to active
    useSyncStore.setState(s => {
      const pd = { ...s.participantsData };
      Object.keys(pd).forEach(k => { pd[k] = { ...pd[k], status: 'active' } });
      return { participantsData: pd };
    });
  }
});
