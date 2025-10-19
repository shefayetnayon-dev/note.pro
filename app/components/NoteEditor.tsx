'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { format } from 'date-fns';
import { 
  Save, 
  Tag, 
  X, 
  Eye, 
  Edit3, 
  Download, 
  FileText, 
  FileDown,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Type,
  Palette,
  Image,
  Link,
  Link2Off
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface LinkDialogState {
  isOpen: boolean;
  url: string;
  text: string;
  selection: {
    range: Range | null;
    text: string;
  } | null;
}

export default function NoteEditor() {
  const {
    notes,
    activeNoteId,
    updateNote,
    deleteNote,
    togglePinNote,
  } = useNoteStore();

  const [isPreview, setIsPreview] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({
    isOpen: false,
    url: '',
    text: '',
    selection: null
  });
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    heading1: false,
    heading2: false,
  });
  
  const editorRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<string>('');

  const activeNote = notes.find((note) => note.id === activeNoteId);

  // Store content when switching to preview mode
  const handlePreviewToggle = () => {
    if (editorRef.current && !isPreview) {
      contentRef.current = editorRef.current.innerHTML;
      // Save the current content before switching
      if (activeNote) {
        updateNote(activeNote.id, {
          title: activeNote.title || 'Untitled Note',
          content: editorRef.current.innerHTML || '',
        });
      }
    }
    setIsPreview(!isPreview);
  };

  // Auto-save functionality
  useEffect(() => {
    if (activeNote && editorRef.current && !isPreview) {
      const timer = setTimeout(() => {
        const currentContent = editorRef.current?.innerHTML || '';
        if (currentContent !== contentRef.current) {
          contentRef.current = currentContent;
          updateNote(activeNote.id, {
            title: activeNote.title || 'Untitled Note',
            content: currentContent,
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editorRef.current?.innerHTML, activeNote, updateNote, isPreview]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update editor content when note changes
  useEffect(() => {
    if (editorRef.current && activeNote && !isPreview) {
      // Only update if the content is different to avoid cursor jumping
      if (editorRef.current.innerHTML !== (activeNote.content || '')) {
        editorRef.current.innerHTML = activeNote.content || '';
        contentRef.current = activeNote.content || '';
      }
    }
  }, [activeNote, isPreview]);

  // Check for active formatting
  useEffect(() => {
    const checkFormatting = () => {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        heading1: document.queryCommandValue('formatBlock') === 'h1',
        heading2: document.queryCommandValue('formatBlock') === 'h2',
      });
    };

    // Initial check
    checkFormatting();

    // Check when selection changes
    document.addEventListener('selectionchange', checkFormatting);
    return () => document.removeEventListener('selectionchange', checkFormatting);
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Update active formats after command
    setTimeout(() => {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        heading1: document.queryCommandValue('formatBlock') === 'h1',
        heading2: document.queryCommandValue('formatBlock') === 'h2',
      });
    }, 10);
  }, []);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (activeNote && !activeNote.tags.includes(newTag.trim())) {
        updateNote(activeNote.id, {
          tags: [...activeNote.tags, newTag.trim()],
        });
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (!activeNote) return;

    updateNote(activeNote.id, {
      tags: activeNote.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Made alt text more descriptive
        const img = `<img src="${event.target?.result}" alt="Uploaded image: ${file.name}" style="max-width: 100%; height: auto;" />`;
        document.execCommand('insertHTML', false, img);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLinkClick = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || '';
    
    // Save the current selection
    const clonedRange = range.cloneRange();
    
    setLinkDialog({
      isOpen: true,
      url: '',
      text: selectedText,
      selection: {
        range: clonedRange,
        text: selectedText
      }
    });
  };

  const handleLinkSubmit = () => {
    if (!linkDialog.selection || !linkDialog.url) {
      setLinkDialog({ isOpen: false, url: '', text: '', selection: null });
      return;
    }

    // Restore the selection
    const selection = window.getSelection();
    if (selection && linkDialog.selection.range) {
      try {
        selection.removeAllRanges();
        selection.addRange(linkDialog.selection.range);
      } catch (e) {
        // Fallback for older browsers
        console.warn('Could not restore selection:', e);
      }
    }

    // Create the link element
    const linkText = linkDialog.text || linkDialog.selection.text;
    const linkHtml = `<a href="${linkDialog.url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${linkText}</a>`;
    
    // Insert the link
    if (linkDialog.selection.range) {
      linkDialog.selection.range.deleteContents();
      const fragment = document.createDocumentFragment();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = linkHtml;
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      linkDialog.selection.range.insertNode(fragment);
    } else {
      // Fallback: use execCommand
      document.execCommand('insertHTML', false, linkHtml);
    }

    // Clear the dialog state
    setLinkDialog({ isOpen: false, url: '', text: '', selection: null });
    
    // Focus back to editor
    editorRef.current?.focus();
  };

  const removeLink = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parentElement = range.commonAncestorContainer.parentElement;
      
      // Check if selection is within a link
      let linkElement = parentElement;
      while (linkElement && linkElement !== editorRef.current) {
        if (linkElement.tagName === 'A') {
          // Replace the link with its text content
          const text = linkElement.textContent || '';
          const textNode = document.createTextNode(text);
          linkElement.parentNode?.replaceChild(textNode, linkElement);
          break;
        }
        linkElement = linkElement.parentElement;
      }
    }
    
    // Also try the unlink command as a fallback
    document.execCommand('unlink', false);
    editorRef.current?.focus();
  };

  const applyColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    setSelectedColor(color);
    setShowColorPicker(false);
    editorRef.current?.focus();
  };

  const downloadAsTxt = () => {
    setShowDownloadMenu(false);
    
    // FIX: Add null check for activeNote
    if (!activeNote) return;
    
    const content = editorRef.current?.innerText || '';
    const element = document.createElement('a');
    const file = new Blob([
      `${activeNote.title}\n\n${content}\n\nTags: ${activeNote.tags.join(', ')}\n\nCreated: ${format(new Date(activeNote.createdAt), 'PPP')}\nUpdated: ${format(new Date(activeNote.updatedAt), 'PPP p')}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeNote.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAsPdf = async () => {
    setShowDownloadMenu(false);
    
    // FIX: Add null check for activeNote
    if (!activeNote) return;
    
    setIsDownloading(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '794px';
      tempDiv.style.padding = '40px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      const titleElement = document.createElement('h1');
      titleElement.textContent = activeNote.title;
      titleElement.style.marginBottom = '20px';
      tempDiv.appendChild(titleElement);
      
      const contentElement = document.createElement('div');
      contentElement.innerHTML = editorRef.current?.innerHTML || '';
      contentElement.style.marginBottom = '20px';
      tempDiv.appendChild(contentElement);
      
      if (activeNote.tags.length > 0) {
        const tagsElement = document.createElement('div');
        tagsElement.textContent = `Tags: ${activeNote.tags.join(', ')}`;
        tagsElement.style.marginBottom = '10px';
        tagsElement.style.fontSize = '12px';
        tagsElement.style.color = '#666';
        tempDiv.appendChild(tagsElement);
      }
      
      const datesElement = document.createElement('div');
      datesElement.style.fontSize = '10px';
      datesElement.style.color = '#999';
      datesElement.innerHTML = `
        <div>Created: ${format(new Date(activeNote.createdAt), 'PPP')}</div>
        <div>Updated: ${format(new Date(activeNote.updatedAt), 'PPP p')}</div>
      `;
      tempDiv.appendChild(datesElement);
      
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${activeNote.title}.pdf`);
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Added title tag for accessibility */}
              <title>Document Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-lg">Select a note to start editing</p>
          <p className="text-sm mt-2">Or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <input
            type="text"
            value={activeNote.title}
            onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
            className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-gray-900 dark:text-white placeholder-gray-400"
            placeholder="Note Title"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => togglePinNote(activeNote.id)}
              className={`p-2 rounded-lg transition-colors ${
                activeNote.isPinned
                  ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={activeNote.isPinned ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button
              onClick={handlePreviewToggle}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isPreview ? <Edit3 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Download options"
              >
                <Download className="w-5 h-5" />
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={downloadAsTxt}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md"
                  >
                    <FileText className="w-4 h-4" />
                    Download as TXT
                  </button>
                  <button
                    onClick={downloadAsPdf}
                    disabled={isDownloading}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 rounded-b-md"
                  >
                    <FileDown className="w-4 h-4" />
                    {isDownloading ? 'Generating PDF...' : 'Download as PDF'}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => deleteNote(activeNote.id)}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Created: {format(new Date(activeNote.createdAt), 'MMM d, yyyy')}</span>
          <span>Updated: {format(new Date(activeNote.updatedAt), 'MMM d, yyyy h:mm a')}</span>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {activeNote.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-blue-900 dark:hover:text-blue-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tag..."
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>
      </div>

      {/* Formatting Toolbar */}
      {!isPreview && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => execCommand('formatBlock', '<h1>')}
                className={`p-2 rounded transition-colors ${
                  activeFormats.heading1 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => execCommand('formatBlock', '<h2>')}
                className={`p-2 rounded transition-colors ${
                  activeFormats.heading2 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => execCommand('formatBlock', '<p>')}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Paragraph"
              >
                <Type className="w-4 h-4" />
              </button>
            </div>

            {/* Text Style */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => execCommand('bold')}
                className={`p-2 rounded transition-colors font-bold ${
                  activeFormats.bold 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => execCommand('italic')}
                className={`p-2 rounded transition-colors italic ${
                  activeFormats.italic 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => execCommand('underline')}
                className={`p-2 rounded transition-colors underline ${
                  activeFormats.underline 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Underline"
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            {/* Color Picker */}
            <div className="relative" ref={colorPickerRef}>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Text Color"
              >
                <Palette className="w-4 h-4" />
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="grid grid-cols-6 gap-1">
                    {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
                      '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080'].map((color) => (
                      <button
                        key={color}
                        onClick={() => applyColor(color)}
                        className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="w-full mt-2 h-8 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Insert Options */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-300 dark:border-gray-600">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Insert Image"
              >
                <Image className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Link Options */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleLinkClick}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Add Link"
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                onClick={removeLink}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Remove Link"
              >
                <Link2Off className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4" id="note-content">
        {isPreview ? (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeNote.content || 'Start writing...'}
            </ReactMarkdown>
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            className="w-full h-full min-h-[400px] outline-none text-gray-900 dark:text-white bg-transparent placeholder-gray-400 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:mb-2 [&_a]:text-blue-500 [&_a]:underline"
            style={{ minHeight: '400px' }}
            suppressContentEditableWarning={true}
            onInput={(e) => {
              // Force update to trigger auto-save
              e.currentTarget.dispatchEvent(new Event('change', { bubbles: true }));
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 px-4 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {editorRef.current?.innerText?.length || 0} characters
        </span>
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <Save className="w-3 h-3" />
          Auto-saved
        </div>
      </div>

      {/* Link Dialog */}
      {linkDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add Hyperlink
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkDialog.text}
                  onChange={(e) => setLinkDialog({ ...linkDialog, text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Text to display"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkDialog.url}
                  onChange={(e) => setLinkDialog({ ...linkDialog, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setLinkDialog({ isOpen: false, url: '', text: '', selection: null })}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkSubmit}
                disabled={!linkDialog.url}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}