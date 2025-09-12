import { FC } from 'react';

interface IconTrendingDownProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconTrendingDown: FC<IconTrendingDownProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M22 17L13.5 8.5L8.5 13.5L2 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 17H22V11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default IconTrendingDown;