import { FC } from 'react';

interface IconDeviceTabletProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconDeviceTablet: FC<IconDeviceTabletProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect
                x="4"
                y="2"
                width="16"
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

export default IconDeviceTablet;