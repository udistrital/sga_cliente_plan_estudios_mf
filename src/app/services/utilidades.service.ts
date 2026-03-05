import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
    providedIn: 'root',
})
export class UtilidadesService {

    static userArray: any[];
    static jsonArray: any[];
    private documentsList: any[] = [];
    private mimeTypes: any = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "text/plain": ".txt",
        "text/html": ".html",
        "text/css": ".css",
        "text/javascript": ".js",
        "application/json": ".json",
        "application/xml": ".xml"
    };

    constructor(
        private translate: TranslateService,
    ) {
    }

    static getSumArray(array: any[]): any {
        let sum = 0;
        array.forEach((element: number) => {
            sum += element;
        });
        return sum;
    }

    translateTree(tree: any) {
        const trans = tree.map((n: any) => {
            let node = {};
            node = {
                id: n.Id,
                name: n.Nombre,
            }
            if (n.hasOwnProperty('Opciones')) {
                if (n.Opciones !== null) {
                    const children = this.translateTree(n.Opciones);
                    node = { ...node, ...{ children: children } };
                }
                return node;
            } else {
                return node;
            }
        });
        return trans;
    }


    translateFields(form: { campos: any[]; }, prefix: any, prefix_placeholder: any) {
        form.campos = form.campos.map((field: any) => {
            return {
                ...field,
                ...{
                    label: this.translate.instant(prefix + field.label_i18n),
                    placeholder: this.translate.instant(prefix + field.placeholder_i18n)
                }
            }
        });
    }


    getEvaluacionDocumento(MetadatosString: string) {
        let ObjetMetadatos = {
            aprobado: false,
            estadoObservacion: this.translate.instant('GLOBAL.estado_no_definido'),
            observacion: ""
        };
        if (MetadatosString !== '') {
            let metadatos = JSON.parse(MetadatosString);
            if (metadatos.hasOwnProperty('aprobado') && metadatos.hasOwnProperty('observacion')) {
                if (metadatos.aprobado) {
                    ObjetMetadatos.aprobado = true;
                    ObjetMetadatos.estadoObservacion = this.translate.instant('GLOBAL.estado_aprobado');
                } else {
                    ObjetMetadatos.aprobado = false;
                    ObjetMetadatos.estadoObservacion = this.translate.instant('GLOBAL.estado_no_aprobado');
                }
                ObjetMetadatos.observacion = metadatos.observacion;
            }
        }
        return ObjetMetadatos;
    }

    getUrlFile(base64: any, minetype: any) {
        return new Promise<string>((resolve, reject) => {
            const url = `data:${minetype};base64,${base64}`;
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "File name", { type: minetype })
                    const url = URL.createObjectURL(file);
                    resolve(url);
                })
        });
    }

    async mapDocuments(response: any): Promise<any[]> {
        const listaDocsRaw: any[] = response?.Data ?? [];
        const results = await Promise.all(
            listaDocsRaw.map(async (doc: any) => {
                if (!doc?.Nuxeo) return null;
                const mime = doc.Nuxeo['file:content']['mime-type'];
                return {
                    Id: doc.Id,
                    Nombre: doc.Nombre,
                    Enlace: doc.Enlace,
                    Url: await this.getUrlFile(doc.Nuxeo.file, mime),
                    TipoArchivo: this.mimeTypes[mime],
                };
            })
        );
        this.documentsList.push(...results.filter(Boolean));
        return this.documentsList;
    }

    getByIdLocal(id: number) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        const doc = this.documentsList.find(doc => doc.Id === id);
        if (doc != undefined) {
            setTimeout(() => {
                documentsSubject.next({ "Id": doc.Id, "nombre": doc.Nombre, "url": doc.Url, "type": doc.TipoArchivo });
            }, 1);
        } else {
            documentsSubject.error("Document not found");
        }
        return documents$
    }

    static hardCopy(Objeto: Object): Object {
        return JSON.parse(JSON.stringify(Objeto));
    }

    static ListaPatrones = {
        correo: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
    }

}
