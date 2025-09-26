import { Component, OnInit, OnDestroy } from '@angular/core';
import { PersonService } from '../../services/person.service';
import { Document } from '../../models';
import { Subscription, interval } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ReminderItem {
  document: Document;
  personName: string;
  daysUntilExpiry: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

@Component({
  selector: 'app-reminder-system',
  templateUrl: './reminder-system.component.html',
  styleUrls: ['./reminder-system.component.css']
})
export class ReminderSystemComponent implements OnInit, OnDestroy {
  reminders: ReminderItem[] = [];
  private reminderSubscription?: Subscription;
  private intervalSubscription?: Subscription;
  
  displayedColumns: string[] = ['personName', 'documentName', 'documentType', 'expiryDate', 'daysLeft', 'urgency', 'actions'];

  constructor(
    private personService: PersonService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReminders();
    // Controlla le scadenze ogni ora
    this.intervalSubscription = interval(3600000).subscribe(() => {
      this.loadReminders();
    });
  }

  ngOnDestroy(): void {
    if (this.reminderSubscription) {
      this.reminderSubscription.unsubscribe();
    }
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
  }

  loadReminders(): void {
    this.reminderSubscription = this.personService.getExpiringDocuments(60).subscribe(documents => {
      this.reminders = this.processDocuments(documents);
      this.checkForCriticalReminders();
    });
  }

  private processDocuments(documents: Document[]): ReminderItem[] {
    const currentDate = new Date();
    const reminders: ReminderItem[] = [];

    // Ottieni tutte le persone per associare i nomi ai documenti
    this.personService.getPersons().subscribe(persons => {
      documents.forEach(doc => {
        const person = persons.find(p => p.id === doc.personId);
        if (person && doc.expiryDate) {
          const expiryDate = new Date(doc.expiryDate);
          const timeDiff = expiryDate.getTime() - currentDate.getTime();
          const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

          const reminder: ReminderItem = {
            document: doc,
            personName: `${person.firstName} ${person.lastName}`,
            daysUntilExpiry,
            urgencyLevel: this.calculateUrgencyLevel(daysUntilExpiry)
          };

          reminders.push(reminder);
        }
      });

      // Ordina per urgenza e giorni rimanenti
      this.reminders = reminders.sort((a, b) => {
        const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
          return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
        }
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });
    });

    return [];
  }

  private calculateUrgencyLevel(daysUntilExpiry: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysUntilExpiry < 0) return 'critical'; // Scaduto
    if (daysUntilExpiry <= 7) return 'critical'; // Scade entro una settimana
    if (daysUntilExpiry <= 15) return 'high'; // Scade entro 15 giorni
    if (daysUntilExpiry <= 30) return 'medium'; // Scade entro un mese
    return 'low'; // Scade entro 60 giorni
  }

  private checkForCriticalReminders(): void {
    const criticalReminders = this.reminders.filter(r => r.urgencyLevel === 'critical');
    if (criticalReminders.length > 0) {
      const message = `Attenzione! ${criticalReminders.length} documento/i in scadenza critica`;
      this.snackBar.open(message, 'Visualizza', {
        duration: 10000,
        panelClass: ['critical-snackbar']
      });
    }
  }

  getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'critical': return 'warn';
      case 'high': return 'accent';
      case 'medium': return 'primary';
      case 'low': return '';
      default: return '';
    }
  }

  getUrgencyIcon(urgency: string): string {
    switch (urgency) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'schedule';
      default: return 'schedule';
    }
  }

  formatDaysLeft(days: number): string {
    if (days < 0) {
      return `Scaduto da ${Math.abs(days)} giorni`;
    } else if (days === 0) {
      return 'Scade oggi';
    } else if (days === 1) {
      return 'Scade domani';
    } else {
      return `${days} giorni`;
    }
  }

  viewDocument(reminder: ReminderItem): void {
    // TODO: Implementare la visualizzazione del documento
    console.log('Visualizza documento:', reminder.document.name);
  }

  markAsHandled(reminder: ReminderItem): void {
    // TODO: Implementare la marcatura come gestito
    console.log('Marcato come gestito:', reminder.document.name);
    this.snackBar.open('Promemoria marcato come gestito', 'Chiudi', {
      duration: 3000
    });
  }

  refreshReminders(): void {
    this.loadReminders();
    this.snackBar.open('Promemoria aggiornati', 'Chiudi', {
      duration: 2000
    });
  }
}