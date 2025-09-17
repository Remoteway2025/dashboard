"use client";
import { Thumbnail } from "@payloadcms/ui";
import Link from "next/link";

function ImageThumbnail({ url, link, onClick }) {

    return (
        <Link className="pointer" href={link} >
            <Thumbnail size="small" className="consultant-image" fileSrc={url} />
        </Link>);
}

export default ImageThumbnail;