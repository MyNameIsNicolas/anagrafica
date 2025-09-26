import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Document, DocumentType } from '../../models';

@Component({
  selector: 'app-document-manager',
  templateUrl: './document-manager.component.html',
  styleUrls: ['./document-manager.component.css']
})
export class DocumentManagerComponent implements OnInit {
  @Input() personId!: number;
  @Input() documents: Document[] = [];
  @Output() documentsChange = new EventEmitter<Document[]>();

  documentTypes = Object.values(DocumentType);
  displayedColumns: string[] = ['name', 'type', 'uploadDate', 'expiryDate', 'status', 'actions'];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.sortDocuments();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadDocument(file);
    }
  }

  uploadDocument(file: File): void {
    // Simulazione upload - in un'app reale si farebbe una chiamata HTTP
    const newDocument: Document = {
      id: Date.now(), // ID temporaneo
      personId: this.personId,
      name: file.name.split('.')[0],
      type: DocumentType.OTHER,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadDate: new Date(),
      isActive: true,
      createdAt: new Date()
    };

    this.documents = [...this.documents, newDocument];
    this.documentsChange.emit(this.documents);
    this.sortDocuments();

    this.snackBar.open('Documento caricato con successo', 'Chiudi', {
      duration: 3000
    });
  }

  editDocument(document: Document): void {
    // Implementazione per modificare il documento
    console.log('Edit document:', document);
  }

  deleteDocument(documentId: number): void {
    this.documents = this.documents.filter(doc => doc.id !== documentId);
    this.documentsChange.emit(this.documents);
    
    this.snackBar.open('Documento eliminato', 'Chiudi', {
      duration: 3000
    });
  }

  downloadDocument(document: Document): void {
    // Implementazione per scaricare il documento
    console.log('Download document:', document);
    this.snackBar.open('Funzionalità di download non ancora implementata', 'Chiudi', {
      duration: 3000
    });
  }

  getDocumentTypeLabel(type: DocumentType): string {
    const labels: { [key in DocumentType]: string } = {
      [DocumentType.IDENTITY_CARD]: 'Carta d\'Identità',
      [DocumentType.PASSPORT]: 'Passaporto',
      [DocumentType.DRIVING_LICENSE]: 'Patente',
      [DocumentType.FISCAL_CODE]: 'Codice Fiscale',
      [DocumentType.CONTRACT]: 'Contratto',
      [DocumentType.CERTIFICATE]: 'Certificato',
      [DocumentType.INVOICE]: 'Fattura',
      [DocumentType.RECEIPT]: 'Ricevuta',
      [DocumentType.OTHER]: 'Altro'
    };
    return labels[type];
  }

  isDocumentExpiring(document: Document): boolean {
    if (!document.expiryDate) return false;
    
    const today = new Date();
    const expiryDate = new Date(document.expiryDate);
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    return daysToExpiry <= 30 && daysToExpiry > 0;
  }

  isDocumentExpired(document: Document): boolean {
    if (!document.expiryDate) return false;
    
    const today = new Date();
    const expiryDate = new Date(document.expiryDate);
    
    return expiryDate < today;
  }

  getDaysToExpiry(document: Document): number | null {
    if (!document.expiryDate) return null;
    
    const today = new Date();
    const expiryDate = new Date(document.expiryDate);
    
    return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  }

  getDocumentStatusIcon(document: Document): string {
    if (this.isDocumentExpired(document)) return 'error';
    if (this.isDocumentExpiring(document)) return 'warning';
    return 'check_circle';
  }

  getDocumentStatusColor(document: Document): string {
    if (this.isDocumentExpired(document)) return 'warn';
    if (this.isDocumentExpiring(document)) return 'accent';
    return 'primary';
  }

  private sortDocuments(): void {
    this.documents.sort((a, b) => {
      // Prima i documenti scaduti
      if (this.isDocumentExpired(a) && !this.isDocumentExpired(b)) return -1;
      if (!this.isDocumentExpired(a) && this.isDocumentExpired(b)) return 1;
      
      // Poi quelli in scadenza
      if (this.isDocumentExpiring(a) && !this.isDocumentExpiring(b)) return -1;
      if (!this.isDocumentExpiring(a) && this.isDocumentExpiring(b)) return 1;
      
      // Infine per data di caricamento (più recenti prima)
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });
  }
}