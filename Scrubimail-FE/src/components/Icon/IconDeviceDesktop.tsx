import { FC } from 'react';

interface IconDeviceDesktopProps {
    className?: string;
    fill?: boolean;
    duotone?: boolean;
}

const IconDeviceDesktop: FC<IconDeviceDesktopProps> = ({ className, fill = false, duotone = true }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect
                x="2"
                y="3"
                width="20"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M8 21H16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M12 17V21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default IconDeviceDesktop;