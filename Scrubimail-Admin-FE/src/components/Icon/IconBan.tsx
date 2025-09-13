import { FC } from 'react';

interface IconBanProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconBan: FC<IconBanProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
};

export default IconBan;