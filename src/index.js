/********************************************************************************
 * Copyright (C) 2023 CoCreate and Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 ********************************************************************************/

// Commercial Licensing Information:
// For commercial use of this software without the copyleft provisions of the AGPLv3,
// you must obtain a commercial license from CoCreate LLC.
// For details, visit <https://cocreate.app/licenses/> or contact us at sales@cocreate.app.


const { URL } = require('url');

class CoCreateUrlUploader {
    constructor(crud) {
        this.crud = crud
        crud.wsManager.on('importUrl', async (data) => {
            this.fetchFileFromURL(data)
        });
    }


    async fetchFileFromURL(data) {
        try {
            const file = data.file
            const fetch = await import('node-fetch').then(module => module.default);
            const response = await fetch(file.src);

            if (!response.ok) {
                throw new Error('Failed to fetch file: ' + response.statusText);
            }

            const arrayBuffer = await response.arrayBuffer();
            file.src = arrayBufferToBase64(arrayBuffer)

            file.size = arrayBuffer.byteLength
            file['content-type'] = response.headers.get('content-type')

            if (!file.name) {
                const parsedUrl = new URL(file.src);
                file.name = parsedUrl.pathname.split('/').pop();
            }

            if (!file.directory)
                file.directory = '/'
            if (!file.path)
                file.path = file.directory
            if (!file.pathname) {
                if (file.path.endsWith('/'))
                    file.pathname = file.path + file.name
                else
                    file.pathname = file.path + '/' + file.name
            }
            if (data.socket)
                this.crud.wsManager.send(data)

            // return data;
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return Buffer.from(binary, 'binary').toString('base64');
    }
}

module.exports = CoCreateUrlUploader;
