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

const fetchPeerConfig = async () => {
  try {
    console.log("[WTC] Requesting fresh TURN credentials from Metered API...");
    const apiKey = import.meta.env.VITE_TURN_API_KEY || '';
    const response = await fetch(`https://revise.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
    const iceServers = await response.json();
    console.log("[WTC] Successfully fetched ICE servers configuration:", iceServers);
    return { config: { iceServers } };
  } catch (error) {
    console.error("[WTC] Failed to fetch TURN credentials, falling back to basic STUN", error);
    return { config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] } };
  }
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
  hostRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
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

  hostRoom: async () => {
    set({ status: 'connecting', error: null });
    
    const shortCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const fullRoomId = `revise-room-${shortCode}`;
    
    console.log(`[HOST] Initializing Peer with ID: ${fullRoomId}...`);
    
    const peerConfig = await fetchPeerConfig();
    const peer = new Peer(fullRoomId, { ...peerConfig, debug: 3 });

    peer.on('open', (id) => {
      console.log(`[HOST] Connected to signaling server! Assigned ID: ${id}`);
      const initData: ParticipantData = { id, name: get().userName, status: 'lobby' };
      set({ 
        peer, 
        roomId: shortCode, 
        role: 'host', 
        status: 'connected', 
        participantsData: { [id]: initData } 
      });
    });

    peer.on('disconnected', () => {
      console.warn(`[HOST] Disconnected from signaling server.`);
    });

    peer.on('connection', (conn) => {
      console.log(`[HOST] Incoming connection attempt from: ${conn.peer}`);
      
      conn.on('open', () => {
        console.log(`[HOST] Connection established with: ${conn.peer}`);
        set((state) => ({
          connections: [...state.connections, conn]
        }));

        // Instantly send the full room state to the new client
        conn.send({ 
          type: 'SYNC_LOBBY_STATE', 
          participantsData: get().participantsData 
        } as SyncAction);

        // If the host already picked a config, send it to the new joined room user
        const testStore = useTestStore.getState();
        if (testStore.config) {
          conn.send({ type: 'TEST_START', config: testStore.config } as SyncAction);
        }
      });

      conn.on('data', (data: any) => {
        const action = data as SyncAction;
        get().handleIncomingAction(action);
        
        // Host acts as relay network to all other clients
        const state = get();
        state.connections.forEach(c => {
          if (c !== conn) c.send(action);
        });
      });

      conn.on('error', (err) => {
         console.error(`[HOST] Connection error with ${conn.peer}:`, err);
      });

      conn.on('close', () => {
        console.log(`[HOST] Connection closed with: ${conn.peer}`);
        set((state) => ({
          connections: state.connections.filter((c) => c !== conn),
        }));
        
        const leaveAction: SyncAction = { type: 'USER_LEAVE', peerId: conn.peer };
        get().handleIncomingAction(leaveAction);
        get().broadcastAction(leaveAction);
      });
    });

    peer.on('error', (err) => {
      console.error(`[HOST] PeerJS critical error:`, err);
      set({ status: 'error', error: `Host Error: ${err.type || err.message}` });
    });
  },

  joinRoom: async (shortCode: string) => {
    set({ status: 'connecting', error: null });
    const roomId = shortCode.toUpperCase();
    const fullRoomId = `revise-room-${roomId}`;
    
    console.log(`[GUEST] Initiating connection targeting Room ID: ${fullRoomId}`);
    
    const peerConfig = await fetchPeerConfig();
    const peer = new Peer({ ...peerConfig, debug: 3 });

    peer.on('open', (id) => {
      console.log(`[GUEST] Interfaced with signaling server. Assigned client ID: ${id}`);
      console.log(`[GUEST] Dialing host...`);
      
      const conn = peer.connect(fullRoomId, { reliable: true });
      
      conn.on('open', () => {
        console.log(`[GUEST] WebRTC ICE tunnel connected to host successfully!`);
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
        conn.send({ type: 'USER_JOIN', peerId: id, name: get().userName } as SyncAction);
      });

      conn.on('data', (data: any) => {
         get().handleIncomingAction(data as SyncAction);
      });

      conn.on('error', (err) => {
         console.error(`[GUEST] P2P Connection exception:`, err);
      });

      conn.on('close', () => {
         console.warn(`[GUEST] P2P Connection closed by host.`);
         get().leaveRoom();
         set({ error: 'Host disconnected.'});
      });

      peer.on('error', (err) => {
         console.error(`[GUEST] PeerJS Critical exception:`, err);
         set({ status: 'error', error: `Connection failed: ${err.type || err.message}` });
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

  broadcastAction: (action) => {
    const { connections } = get();
    if (connections.length === 0) return;
    connections.forEach((conn) => conn.send(action));
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
