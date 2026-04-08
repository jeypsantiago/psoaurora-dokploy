import React, { useEffect, useRef } from 'react';

interface QRCodeLabelProps {
    data: string;
    label?: string;
    size?: number;
    className?: string;
}

export const QRCodeLabel: React.FC<QRCodeLabelProps> = ({
    data,
    label,
    size = 120,
    className = '',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let cancelled = false;

        const renderQr = async () => {
            if (!canvasRef.current || !data) return;
            const { default: QRCode } = await import("qrcode");
            if (cancelled || !canvasRef.current) return;

            await QRCode.toCanvas(canvasRef.current, data, {
                width: size,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'M',
            });
        };

        void renderQr().catch(console.error);

        return () => {
            cancelled = true;
        };
    }, [data, size]);

    if (!data) return null;

    return (
        <div className={`inline-flex flex-col items-center ${className}`}>
            <canvas ref={canvasRef} className="rounded-lg border border-zinc-200 dark:border-zinc-700" />
            {label && (
                <span className="mt-1.5 text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center max-w-[120px] truncate">
                    {label}
                </span>
            )}
        </div>
    );
};

/**
 * Generate a QR code as a data URL (base64 PNG)
 */
export async function generateQRDataUrl(data: string): Promise<string> {
    try {
        const { default: QRCode } = await import("qrcode");
        return await QRCode.toDataURL(data, {
            width: 200,
            margin: 1,
            errorCorrectionLevel: 'M',
        });
    } catch {
        return '';
    }
}
