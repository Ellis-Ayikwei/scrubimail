import { FC } from 'react';

interface IconMessageSquareProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconMessageSquare: FC<IconMessageSquareProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                opacity={duotone ? '0.5' : '1'}
                d="M21 15C21 16.6569 19.6569 18 18 18H8L3 21V11C3 9.34315 4.34315 8 6 8H18C19.6569 8 21 9.34315 21 11V15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13 3H16C17.6569 3 19 4.34315 19 6V8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default IconMessageSquare;