import React, { useState } from 'react';
import Modal from 'antd/lib/modal/Modal';
import Button from 'antd/lib/button/button';
import InfoCircleFilled from '@ant-design/icons/InfoCircleFilled';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { LOCATORS } from 'handshake-utils';

export default function AboutModal(properties: { about: string }) {
    const [isOpened, setIsOpened] = useState(false);
    return (
        <>
            <Modal
                // title={}
                open={isOpened}
                width={750}
                closable
                onOk={() => setIsOpened(false)}
                onCancel={() => setIsOpened(false)}
                styles={{ body: { padding: '8px' } }}
                mask={false}
                okButtonProps={{ style: { display: 'none' } }}
                cancelButtonProps={{ style: { display: 'none' } }}
            >
                <MarkdownPreview
                    source={properties.about}
                    style={{ padding: '24px' }}
                />
            </Modal>
            <Button
                icon={<InfoCircleFilled />}
                type="text"
                id={LOCATORS.RUNS.about}
                onClick={() => setIsOpened(!isOpened)}
            />
        </>
    );
}
