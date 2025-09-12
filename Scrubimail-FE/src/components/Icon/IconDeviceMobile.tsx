import { FC } from 'react';

interface IconDeviceMobileProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconDeviceMobile: FC<IconDeviceMobileProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect
                x="5"
                y="2"
                width="14"
                height="20"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M12 18H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default IconDeviceMobile;