import ImageCell from "@/components/client/imageThumbnail"
import { FileCellProps } from "@payloadcms/ui/elements/Table/DefaultCell/fields/File";
import { ServerComponentProps } from "payload";
async function ImageThumbnailWrapper({ cellData, payload, rowData, onClick }: FileCellProps) {

    const result = await payload.findByID({
        collection: "media",
        id: cellData,
        disableErrors: true
    })

    return (<ImageCell onClick={onClick} url={result?.url} link={"/admin/collections/employees/" + rowData?.id} />);
}

export default ImageThumbnailWrapper;