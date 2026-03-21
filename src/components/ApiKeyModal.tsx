import React, { useState } from 'react';
import { Modal, Input, Typography, Button } from 'antd';
import { Key, Lock, AlertCircle } from 'lucide-react';
import { useTestStore } from '../store/testStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const { setApiKey } = useTestStore();

  const handleSubmit = () => {
    if (!key.trim()) {
        setError('Please enter a valid API key');
        return;
    }
    
    // Basic validation (Gemini keys usually start with AIza)
    if (!key.startsWith('AIza')) {
        setError('Invalid API key format. Should start with "AIza..."');
        return;
    }

    setApiKey(key);
    onSuccess(key);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="skip" onClick={onClose}>
          Skip Grading
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Save & Grade
        </Button>
      ]}
      title={null}
      centered
      styles={{ body: { paddingTop: 0 } }}
    >
        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', marginBottom: '16px' }}>
                <Lock className="w-6 h-6" />
            </div>
            <Typography.Title level={4} style={{ margin: 0 }}>Enter Gemini API Key</Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: '14px', display: 'block', marginTop: '8px' }}>
                To evaluate text answers with AI, we need your Google Gemini API key. It will be stored locally in your browser.
            </Typography.Text>
        </div>

        <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'gray' }}>API Key</Typography.Text>
            <Input.Password
                prefix={<Key className="h-4 w-4" style={{ color: 'gray' }} />}
                placeholder="AIza..."
                value={key}
                onChange={(e) => {
                    setKey(e.target.value);
                    setError('');
                }}
                onPressEnter={handleSubmit}
                autoFocus
                size="large"
                style={{ marginTop: '8px' }}
                status={error ? 'error' : ''}
            />
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
        </div>
        
        <Typography.Text type="secondary" style={{ fontSize: '10px', textAlign: 'center', display: 'block', marginTop: '16px' }}>
            Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get one here</a>
        </Typography.Text>
    </Modal>
  );
};
