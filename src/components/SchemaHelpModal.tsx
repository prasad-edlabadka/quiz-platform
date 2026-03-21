import React, { useState } from 'react';
import { Modal, Typography, Button, Space } from 'antd';
import { FileJson, Copy, Check } from 'lucide-react';

interface SchemaHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaHelpModal: React.FC<SchemaHelpModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const exampleJson = `{
  "id": "quiz_01",
  "title": "My Test",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "content": "Question text...",
      "options": [
        { "id": "o1", "content": "Option A", "isCorrect": true },
        { "id": "o2", "content": "Option B", "isCorrect": false }
      ]
    }
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(exampleJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>
      ]}
      title={
        <Space>
          <FileJson className="w-5 h-5 text-indigo-500" />
          <span>Test JSON Schema</span>
        </Space>
      }
      width={700}
      centered
    >
      <Typography>
        <Typography.Paragraph>
          Structure your JSON file according to the schema below. The <code>questions</code> array is required.
        </Typography.Paragraph>

        <Typography.Title level={5}>Required Fields</Typography.Title>
        <ul>
          <li><code>id</code> (string): Unique identifier</li>
          <li><code>title</code> (string): Test title</li>
          <li><code>questions</code> (array): List of Question objects</li>
        </ul>

        <Typography.Title level={5}>Question Object</Typography.Title>
        <ul>
          <li><code>type</code>: "single_choice" | "multiple_choice"</li>
          <li><code>content</code>: Question text (supports Markdown)</li>
          <li><code>options</code>: Array of options having <code>id</code>, <code>content</code>, and <code>isCorrect</code></li>
          <li><code>points</code> (optional): Score value (default: 1)</li>
          <li><code>imageUrl</code> (optional): URL string for image</li>
          <li><code>justification</code> (optional): Explanation text</li>
        </ul>

        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>Minimal Example</Typography.Title>
            <Button
              size="small"
              icon={copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy JSON"}
            </Button>
          </div>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
            {exampleJson}
          </pre>
        </div>
      </Typography>
    </Modal>
  );
};
