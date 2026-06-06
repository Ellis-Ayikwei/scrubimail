import { Moon, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/themeConfigSlice';
import { IRootState, AppDispatch } from '../store';

/** Thin wrapper — delegates to the Redux theme slice (same source of truth as TopBar). */
const DarkModeToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isDark = useSelector((s: IRootState) => s.themeConfig.theme) !== 'light';

  const handleToggle = () => {
    dispatch(toggleTheme(isDark ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={handleToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-sm border border-[#3b4a41]/40 bg-[#1c2024] hover:border-[#6effc0]/40 text-[#bacbbf] hover:text-[#6effc0] transition-all"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

export default DarkModeToggle;
