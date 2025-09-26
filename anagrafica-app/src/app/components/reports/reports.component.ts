import { Component, OnInit } from '@angular/core';
import { PersonService } from '../../services/person.service';
import { Person } from '../../models/person.model';
import { Document } from '../../models/document.model';
import { PersonRelationship } from '../../models/person-relationship.model';

interface StatisticsSummary {
  totalPersons: number;
  totalDocuments: number;
  totalRelationships: number;
  documentsByType: { [key: string]: number };
  relationshipsByType: { [key: string]: number };
  ageGroups: { [key: string]: number };
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  statistics: StatisticsSummary = {
    totalPersons: 0,
    totalDocuments: 0,
    totalRelationships: 0,
    documentsByType: {},
    relationshipsByType: {},
    ageGroups: {}
  };

  persons: Person[] = [];
  loading = true;

  constructor(private personService: PersonService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  private loadStatistics(): void {
    this.personService.getPersons().subscribe({
      next: (persons) => {
        this.persons = persons;
        this.calculateStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle statistiche:', error);
        this.loading = false;
      }
    });
  }

  private calculateStatistics(): void {
    this.statistics.totalPersons = this.persons.length;
    
    // Calcola documenti per tipo
    let totalDocuments = 0;
    const documentsByType: { [key: string]: number } = {};
    
    // Calcola relazioni per tipo
    let totalRelationships = 0;
    const relationshipsByType: { [key: string]: number } = {};
    
    // Calcola gruppi di età
    const ageGroups: { [key: string]: number } = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0
    };

    this.persons.forEach(person => {
      // Conta documenti
      if (person.documents) {
        totalDocuments += person.documents.length;
        person.documents.forEach(doc => {
          documentsByType[doc.type] = (documentsByType[doc.type] || 0) + 1;
        });
      }

      // Conta relazioni
      if (person.relationships) {
        totalRelationships += person.relationships.length;
        person.relationships.forEach(rel => {
          relationshipsByType[rel.relationshipType] = (relationshipsByType[rel.relationshipType] || 0) + 1;
        });
      }

      // Calcola età e gruppo
      if (person.dateOfBirth) {
        const age = this.calculateAge(person.dateOfBirth);
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 35) ageGroups['19-35']++;
        else if (age <= 50) ageGroups['36-50']++;
        else if (age <= 65) ageGroups['51-65']++;
        else ageGroups['65+']++;
      }
    });

    this.statistics.totalDocuments = totalDocuments;
    this.statistics.totalRelationships = totalRelationships;
    this.statistics.documentsByType = documentsByType;
    this.statistics.relationshipsByType = relationshipsByType;
    this.statistics.ageGroups = ageGroups;
  }

  public calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  exportData(): void {
    const dataStr = JSON.stringify(this.statistics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'statistiche-anagrafica.json';
    link.click();
    URL.revokeObjectURL(url);
  }
}
