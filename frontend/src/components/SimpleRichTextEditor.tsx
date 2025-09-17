import React, { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Type,
  Quote,
  Minus,
} from "lucide-react";

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFormat = (tag: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      const element = document.createElement(tag);
      element.textContent = selectedText;
      range.deleteContents();
      range.insertNode(element);
      handleContentChange();
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      handleCommand("createLink", linkUrl);
      setIsLinkDialogOpen(false);
      setLinkUrl("");
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );

  return (
    <div className={`simple-rich-text-editor ${className}`}>
      {!readOnly && (
        <div className="toolbar flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => handleFormat("h2")}
              title="Überschrift 1"
            >
              <Type className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat("h3")}
              title="Überschrift 2"
            >
              <Type className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>
          
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => handleCommand("bold")}
              title="Fett"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleCommand("italic")}
              title="Kursiv"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleCommand("underline")}
              title="Unterstrichen"
            >
              <Underline className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleCommand("strikeThrough")}
              title="Durchgestrichen"
            >
              <Minus className="h-4 w-4" />
            </ToolbarButton>
          </div>
          
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => handleCommand("insertUnorderedList")}
              title="Aufzählungsliste"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleCommand("insertOrderedList")}
              title="Nummerierte Liste"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </div>
          
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => handleFormat("blockquote")}
              title="Zitat"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setIsLinkDialogOpen(true)}
              title="Link einfügen"
            >
              <Link className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>
      )}
      
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        className={`editor min-h-[150px] p-4 border border-gray-300 ${
          readOnly ? "rounded-lg" : "rounded-b-lg border-t-0"
        } focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
        style={{ 
          cursor: readOnly ? "default" : "text",
          userSelect: readOnly ? "text" : "auto"
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />
      
      {isLinkDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Link einfügen</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsLinkDialogOpen(false);
                  setLinkUrl("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Einfügen
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .simple-rich-text-editor .editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        
        .simple-rich-text-editor .editor h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
        }
        
        .simple-rich-text-editor .editor h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0 0.5rem 0;
        }
        
        .simple-rich-text-editor .editor p {
          margin: 0.5rem 0;
        }
        
        .simple-rich-text-editor .editor ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .simple-rich-text-editor .editor ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .simple-rich-text-editor .editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 0.5rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .simple-rich-text-editor .editor a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .simple-rich-text-editor .editor a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default SimpleRichTextEditor;