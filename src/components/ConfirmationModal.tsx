import React from 'react';
import { Modal } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { useTestStore } from '../store/testStore';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) => {
  const { themeMode } = useTestStore();
  const isDark = themeMode === 'dark';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      onOk={() => {
        onConfirm();
        onClose();
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle className={variant === 'danger' ? 'text-red-500' : 'text-orange-500'} />
          <span>{title}</span>
        </div>
      }
      okText={confirmLabel}
      cancelText={cancelLabel}
      okButtonProps={{ danger: variant === 'danger' }}
      centered
    >
      <p style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)' }}>{description}</p>
    </Modal>
  );
};
