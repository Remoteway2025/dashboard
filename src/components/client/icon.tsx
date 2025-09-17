'use client';
import React from 'react';
import DarkTetamanLogo from "public/logo.ico"
import Image from 'next/image';

const Logo = () => {

    return (
        <div style={{ color: "black" }} >
            <Image
                src={DarkTetamanLogo}
                alt={'SVG Image'}
                width={300}
                height={300}
            />
        </div>
    );
};

export default Logo;
