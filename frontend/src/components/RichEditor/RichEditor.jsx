import React, { useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import styles from './RichEditor.module.css';

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

const RichEditor = ({ value = '', onChange, placeholder = 'Write your note content here...' }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = DOMPurify.sanitize(value || '');
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const sanitized = DOMPurify.sanitize(html);
      onChange(sanitized);
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleLink = () => {
    const url = prompt('Enter link URL (e.g. https://example.com):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleBlockFormat = (e) => {
    const val = e.target.value;
    if (val) {
      executeCommand('formatBlock', val);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <select className={styles.headingSelect} onChange={handleBlockFormat} defaultValue="">
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('bold')}
          title="Bold (Ctrl+B)"
        >
          <FormatBoldIcon fontSize="small" />
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('italic')}
          title="Italic (Ctrl+I)"
        >
          <FormatItalicIcon fontSize="small" />
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('underline')}
          title="Underline (Ctrl+U)"
        >
          <FormatUnderlinedIcon fontSize="small" />
        </button>

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <FormatListBulletedIcon fontSize="small" />
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
        >
          <FormatListNumberedIcon fontSize="small" />
        </button>

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleLink}
          title="Insert Link"
        >
          <InsertLinkIcon fontSize="small" />
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('formatBlock', 'pre')}
          title="Code Block"
        >
          <CodeIcon fontSize="small" />
        </button>

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('undo')}
          title="Undo (Ctrl+Z)"
        >
          <UndoIcon fontSize="small" />
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={() => executeCommand('redo')}
          title="Redo (Ctrl+Y)"
        >
          <RedoIcon fontSize="small" />
        </button>
      </div>

      <div
        ref={editorRef}
        className={styles.contentArea}
        contentEditable
        onInput={handleInput}
        placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichEditor;
