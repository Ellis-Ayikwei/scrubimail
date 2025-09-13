import { FC } from 'react';

interface IconTrendingUpProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconTrendingUp: FC<IconTrendingUpProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M22 7L13.5 15.5L8.5 10.5L2 17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 7H22V13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default IconTrendingUp;
