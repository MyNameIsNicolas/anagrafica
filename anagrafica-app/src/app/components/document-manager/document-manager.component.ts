import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Document, DocumentType } from '../../models';
import { PersonService } from '../../services/person.service';

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
  loading = false;
  personName = '';
  
  // Upload dialog properties
  showUploadDialog = false;
  selectedFile: File | null = null;
  documentForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private personService: PersonService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.documentForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: [DocumentType.OTHER, Validators.required],
      expiryDate: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Se personId non è fornito come Input, lo prendiamo dalla route
    if (!this.personId) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.personId = +id;
        this.loadPersonDocuments();
      }
    } else {
      this.sortDocuments();
    }
  }

  private loadPersonDocuments(): void {
    if (!this.personId) return;
    
    this.loading = true;
    this.personService.getPersonById(this.personId).subscribe({
      next: (person) => {
        if (person) {
          this.documents = person.documents || [];
          this.personName = `${person.firstName} ${person.lastName}`;
          this.sortDocuments();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento dei documenti:', error);
        this.snackBar.open('Errore nel caricamento dei documenti', 'Chiudi', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Pre-popola il nome del documento dal nome del file
      const fileName = file.name.split('.')[0];
      this.documentForm.patchValue({
        name: fileName
      });
      this.showUploadDialog = true;
    }
  }

  cancelUpload(): void {
    this.showUploadDialog = false;
    this.selectedFile = null;
    this.documentForm.reset({
      name: '',
      type: DocumentType.OTHER,
      expiryDate: '',
      description: ''
    });
  }

  confirmUpload(): void {
    if (this.selectedFile && this.documentForm.valid) {
      this.uploadDocument(this.selectedFile);
      this.showUploadDialog = false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  uploadDocument(file: File): void {
    // Ottieni i valori dal form
    const formValues = this.documentForm.value;
    
    // Simulazione upload - in un'app reale si farebbe una chiamata HTTP
    const newDocument: Document = {
      id: Date.now(), // ID temporaneo
      personId: this.personId,
      name: formValues.name,
      type: formValues.type,
      fileName: file.name,
      filePath: `uploads/${this.personId}/${file.name}`, // Percorso simulato
      fileSize: file.size,
      mimeType: file.type,
      uploadDate: new Date(),
      expiryDate: formValues.expiryDate ? new Date(formValues.expiryDate) : undefined,
      description: formValues.description || undefined,
      isActive: true,
      createdAt: new Date()
    };

    // Salva il file in memoria per la visualizzazione (solo per demo)
    this.storeFileForViewing(newDocument.id!, file);

    this.documents = [...this.documents, newDocument];
    this.documentsChange.emit(this.documents);
    this.sortDocuments();

    // Reset del form e file selezionato
    this.selectedFile = null;
    this.documentForm.reset({
      name: '',
      type: DocumentType.OTHER,
      expiryDate: '',
      description: ''
    });

    this.snackBar.open('Documento caricato con successo', 'Chiudi', {
      duration: 3000
    });
  }

  private fileStorage = new Map<number, File>();

  private storeFileForViewing(documentId: number, file: File): void {
    // Memorizza il file per la visualizzazione successiva
    this.fileStorage.set(documentId, file);
  }

  viewDocument(document: Document): void {
    // Implementazione per visualizzare il documento
    if (document.fileName) {
      // Verifica se il documento ha un percorso reale o è un documento caricato
      if (document.filePath) {
        // Documento reale caricato - apre il file effettivo
        this.openRealDocument(document);
      } else {
        // Documento mock - usa URL di esempio
        const documentUrl = this.createDocumentUrl(document);
        window.open(documentUrl, '_blank');
      }
      
      this.snackBar.open(`Documento aperto: ${document.name}`, 'Chiudi', {
        duration: 2000
      });
      
      console.log('View document:', document);
    } else {
      this.snackBar.open('Documento non disponibile per la visualizzazione', 'Chiudi', {
        duration: 3000
      });
    }
  }

  private openRealDocument(document: Document): void {
    // Per documenti reali caricati dall'utente
    if (document.id && this.fileStorage.has(document.id)) {
      // Recupera il file originale dalla memoria
      const file = this.fileStorage.get(document.id)!;
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
      
      // Cleanup dell'URL dopo un po'
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else if (document.filePath) {
      // In un'app reale, questo farebbe una chiamata al server per recuperare il file
      // Per ora mostriamo un messaggio che il file sarebbe recuperato dal server
      this.snackBar.open('In un\'app reale, il file verrebbe recuperato dal server', 'Chiudi', {
        duration: 4000
      });
      
      // Simulazione: apri un documento di esempio
      const documentUrl = this.createDocumentUrl(document);
      window.open(documentUrl, '_blank');
    } else {
      // Fallback per documenti senza percorso
      this.snackBar.open('File non trovato', 'Chiudi', {
        duration: 3000
      });
    }
  }

  private createDocumentUrl(document: Document): string {
    // In un'applicazione reale, questo URL punterebbe al server dove sono archiviati i documenti
    // Per ora creiamo un URL simulato basato sul tipo di documento
    const baseUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/';
    
    // Simuliamo diversi documenti PDF di esempio
    switch (document.type) {
      case 'identity_card':
        return baseUrl + 'dummy.pdf';
      case 'passport':
        return baseUrl + 'dummy.pdf';
      case 'driving_license':
        return baseUrl + 'dummy.pdf';
      case 'contract':
        return baseUrl + 'dummy.pdf';
      case 'certificate':
        return baseUrl + 'dummy.pdf';
      default:
        return baseUrl + 'dummy.pdf';
    }
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