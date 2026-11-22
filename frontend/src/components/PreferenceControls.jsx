import { Moon, Sun } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export default function PreferenceControls() {
  const { language, setLanguage, theme, setTheme } = usePreferences();
  const light = theme === 'light';
  const themeLabel = language === 'km' ? (light ? 'ប្ដូរទៅពណ៌ងងឹត' : 'ប្ដូរទៅពណ៌ភ្លឺ') : (light ? 'Switch to dark mode' : 'Switch to light mode');
  return <div className="preference-controls">
    <select aria-label={language === 'km' ? 'ភាសា' : 'Language'} value={language} onChange={event => setLanguage(event.target.value)}>
      <option value="en" lang="en">EN</option><option value="km" lang="km">ខ្មែរ</option>
    </select>
    <button type="button" className="icon-btn" aria-label={themeLabel} title={themeLabel} onClick={() => setTheme(light ? 'dark' : 'light')}>
      {light ? <Moon size={18}/> : <Sun size={18}/>}
    </button>
  </div>;
}
