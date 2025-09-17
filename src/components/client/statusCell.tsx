"use client"
import { Tag } from 'antd';
import * as _ from "lodash"
import { useTheme } from '@payloadcms/ui';
import { DefaultCellComponentProps } from 'payload';

function Status({ cellData }:DefaultCellComponentProps) {

    const tagStyles = {
        backgroundColor: 'transparent',
        fontWeight: 'bold',
        fontSize: "1rem",
        padding: 8,
        borderRadius: 10
    }

    const getColor = (status) => {
        switch (status) {
            // Active/Success states
            case 'active':
            case 'available':
            case 'approved':
            case 'selected':
            case 'sent':
            case 'resolved':
            case 'open':
            case 'accept':
                return 'green';

            // Warning/Pending states
            case 'under_review':
            case 'pending':
            case 'assigned':
            case 'new':
            case 'draft':
            case 'generated':
            case 'in_progress':
                return 'orange';

            // Info/Processing states
            case 'invoice_generated':
            case 'processed':
            case 'downloaded':
            case 'viewed':
                return 'blue';

            // Error/Negative states
            case 'inactive':
            case 'terminated':
            case 'suspended':
            case 'rejected':
            case 'failed':
            case 'closed':
            case 'decline':
                return 'red';

            default:
                return 'gray';
        }
    };

    return (<>
        <Tag style={tagStyles} color={getColor(cellData)}>
            {_.startCase(cellData)}
        </Tag>
    </>);
}

export default Status;