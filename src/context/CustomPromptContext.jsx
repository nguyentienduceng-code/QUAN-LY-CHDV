import React, { createContext, useState, useContext, useRef, useEffect } from 'react';

const CustomPromptContext = createContext();

export const useCustomPrompt = () => useContext(CustomPromptContext);

export function CustomPromptProvider({ children }) {
  const [promptState, setPromptState] = useState({
    isOpen: false,
    message: '',
    defaultValue: '',
    resolve: null
  });
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (promptState.isOpen && inputRef.current) {
      inputRef.current.focus();
      // Auto select the text like native prompt
      inputRef.current.select();
    }
  }, [promptState.isOpen]);

  const customPrompt = (message, defaultValue = '') => {
    return new Promise((resolve) => {
      setInputValue(defaultValue);
      setPromptState({ isOpen: true, message, defaultValue, resolve });
    });
  };

  const handleConfirm = () => {
    if (promptState.resolve) promptState.resolve(inputValue);
    setPromptState({ isOpen: false, message: '', defaultValue: '', resolve: null });
  };

  const handleCancel = () => {
    if (promptState.resolve) promptState.resolve(null);
    setPromptState({ isOpen: false, message: '', defaultValue: '', resolve: null });
  };

  return (
    <CustomPromptContext.Provider value={customPrompt}>
      {children}
      {promptState.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary, #1f2937)', padding: '24px', borderRadius: '12px',
            width: '90%', maxWidth: '400px', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ 
              marginTop: 0, marginBottom: '20px', color: 'var(--text-primary, #f9fafb)', 
              whiteSpace: 'pre-wrap', fontSize: '1.1rem', fontWeight: '500', lineHeight: '1.5'
            }}>
              {promptState.message}
            </h3>
            <input 
              ref={inputRef}
              type="text" 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { 
                if (e.key === 'Enter') handleConfirm(); 
                if (e.key === 'Escape') handleCancel(); 
              }}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                border: '1px solid var(--border-glass, rgba(255,255,255,0.2))', 
                background: 'rgba(0,0,0,0.2)',
                color: 'white', marginBottom: '24px',
                fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary, #3b82f6)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-glass, rgba(255,255,255,0.2))'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={handleCancel} 
                style={{ 
                  padding: '10px 20px', borderRadius: '8px', border: 'none', 
                  background: 'transparent', color: 'var(--text-secondary, #9ca3af)', 
                  cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' 
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirm} 
                style={{ 
                  padding: '10px 20px', borderRadius: '8px', border: 'none', 
                  background: 'var(--accent-primary, #3b82f6)', color: 'white', 
                  cursor: 'pointer', fontWeight: '600', transition: 'opacity 0.2s' 
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomPromptContext.Provider>
  );
}
