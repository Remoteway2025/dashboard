'use client';
import React from 'react';
import TetamanLogo from "public/logo.svg"
import DarkTetamanLogo from "public/logo.svg"
import Image from 'next/image';
import { useTheme } from '@payloadcms/ui';

const Logo = () => {

    const { theme } = useTheme()

    return (
        <div style={{ color: "black" }} >
            <Image
                src={theme == "dark" ? TetamanLogo : DarkTetamanLogo}
                alt={'SVG Image'}
            />
        </div>
    );
};

export default Logo;
