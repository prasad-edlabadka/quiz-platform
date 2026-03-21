import React from 'react';
import { Modal, Typography, Space, Button } from 'antd';
import { Key, ExternalLink, ShieldCheck, CreditCard } from 'lucide-react';

interface ApiKeyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyHelpModal: React.FC<ApiKeyHelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      styles={{ body: { padding: 0 } }}
      width={500}
    >
      <div className="bg-gradient-to-r from-indigo-600/40 to-purple-600/40 p-6 border-b border-indigo-500/20 rounded-t-lg">
        <Space align="start" size="large">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Key className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: 'white' }}>What is an API Key?</Typography.Title>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.7)' }}>And how to get one for free</Typography.Text>
          </div>
        </Space>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '24px' }}>
          <Typography.Paragraph style={{ margin: 0 }}>
            Think of an API Key like a <strong>digital password</strong> that allows this app to talk to Google's AI brain. You generate it once, and you can reuse it for your quizzes.
          </Typography.Paragraph>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <Typography.Text strong>Safe & Secure</Typography.Text>
              <br/>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Stored only on your device.</Typography.Text>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <CreditCard className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <Typography.Text strong>Free to Use</Typography.Text>
              <br/>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Google offers a generous free tier.</Typography.Text>
            </div>
          </div>
        </div>

        <div>
          <Typography.Title level={5}>How to get your key:</Typography.Title>
          <ol style={{ paddingLeft: '20px', color: 'gray' }}>
            <li>
              Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio <ExternalLink className="w-3 h-3 inline pb-1" /></a> and sign in with Google.
            </li>
            <li style={{ marginTop: '8px' }}>Click the blue <strong>"Create API key"</strong> button.</li>
            <li style={{ marginTop: '8px' }}>Copy the key that starts with <code>AIza...</code> and paste it here!</li>
          </ol>
        </div>

        <div style={{ marginTop: '24px' }}>
          <Button type="primary" size="large" block href="https://aistudio.google.com/app/apikey" target="_blank" onClick={onClose}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Get my Free API Key <ExternalLink className="w-4 h-4 ml-2" />
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
