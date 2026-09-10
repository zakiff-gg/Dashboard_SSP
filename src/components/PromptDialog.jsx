import { createContext, useContext, useState } from "react";

const PromptContext = createContext(null);

export function PromptProvider({ children }) {
  const [state, setState] = useState(null); // { title, fields, values, resolve }

  function openPrompt(title, fields) {
    return new Promise((resolve) => {
      const values = {};
      fields.forEach((f) => (values[f.name] = f.defaultValue || ""));
      setState({ title, fields, values, resolve });
    });
  }

  function updateValue(name, value) {
    setState((prev) => ({ ...prev, values: { ...prev.values, [name]: value } }));
  }

  function handle(result) {
    if (state) state.resolve(result ? state.values : null);
    setState(null);
  }

  return (
    <PromptContext.Provider value={openPrompt}>
      {children}
      {state && (
        <div className="confirm-overlay" onClick={() => handle(false)}>
          <div className="confirm-card prompt-card" onClick={(e) => e.stopPropagation()}>
            <p className="prompt-title">{state.title}</p>
            {state.fields.map((f) => (
              <div key={f.name} className="prompt-field">
                <label>{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={state.values[f.name]}
                  autoFocus={f.autoFocus}
                  onChange={(e) => updateValue(f.name, e.target.value)}
                />
              </div>
            ))}
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => handle(false)}>
                Batal
              </button>
              <button className="action-btn" onClick={() => handle(true)}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error("usePrompt must be used within PromptProvider");
  return ctx;
}
