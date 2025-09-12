import { FC } from 'react';

interface IconFilterProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconFilter: FC<IconFilterProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default IconFilter;