import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Essentials,
    Bold,
    Italic,
    Paragraph,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,
    List,
    Alignment
} from 'ckeditor5';
import MathType from '@wiris/mathtype-ckeditor5/dist/browser/index.js';
import '@wiris/mathtype-ckeditor5/dist/browser/index.css';

import 'ckeditor5/ckeditor5.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  readOnly = false
}) => {
    return (
        <div className="ck-content">
            <CKEditor
                editor={ ClassicEditor }
                data={ value }
                onChange={ ( _, editor ) => {
                    const data = editor.getData();
                    onChange(data);
                } }
                config={ {
                    plugins: [
                        Essentials, Paragraph, Bold, Italic, Underline, Strikethrough, 
                        Subscript, Superscript, List, Alignment, MathType 
                    ],
                    toolbar: [ 
                        'bold', 'italic', 'underline', 'strikethrough', 
                        '|', 'subscript', 'superscript', 
                        '|', 'alignment', // Add alignment dropdown
                        '|', 'bulletedList', 'numberedList', 
                        '|', 'MathType', 'ChemType', 
                        '|', 'undo', 'redo' 
                    ],
                    placeholder: placeholder,
                    licenseKey: 'GPL'
                } }
                disabled={readOnly}
            />
            <style>{`
                .ck-editor__editable_inline {
                    min-height: 200px;
                }
                
                /* CKEditor 5 Dark Mode Variables Override */
                :root[class~="dark"] {
                    --ck-color-base-background: #1e293b;
                    --ck-color-base-border: #334155;
                    --ck-color-toolbar-background: #0f172a;
                    --ck-color-toolbar-border: #334155;
                    --ck-color-text: #f8fafc;
                    
                    /* Buttons */
                    --ck-color-button-default-hover-background: #334155;
                    --ck-color-button-on-background: #334155;
                    --ck-color-button-on-hover-background: #475569;
                    --ck-color-button-on-active-background: #475569;
                    
                    /* Dropdowns & Lists */
                    --ck-color-list-background: #1e293b;
                    --ck-color-list-button-hover-background: #334155;
                    --ck-color-dropdown-panel-background: #1e293b;
                    --ck-color-dropdown-panel-border: #475569;
                    --ck-color-input-background: #0f172a;
                    --ck-color-input-border: #334155;
                    
                    /* Content */
                    --ck-color-editor-base-text: #f1f5f9;
                }

                /* Specific Overrides */
                :root[class~="dark"] .ck-editor__editable {
                    background-color: #1e293b !important;
                    color: #f1f5f9 !important;
                }
                
                /* Fix Icons in Dark Mode */
                :root[class~="dark"] .ck-icon {
                    color: #f1f5f9;
                }
                
                /* Invert Wiris MathType Modal for "Fake" Dark Mode */
                /* This turns the white modal black and black text white */
                :root[class~="dark"] .wrs_modal_dialogContainer {
                    filter: invert(0.92) hue-rotate(180deg);
                }
                :root[class~="dark"] .wrs_content_container {
                     background: white; /* Ensure base is white before invert so it becomes black */
                }
            `}</style>
        </div>
    );
};
