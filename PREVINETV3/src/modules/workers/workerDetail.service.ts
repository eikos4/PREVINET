import { getWorkerById } from './worker.service';
import { getIRLsForWorker } from '../irl/irl.service';
import { getTalksForWorker } from '../talks/talk.service';
import { getFitForWorkForWorker } from '../fitForWork/fitForWork.service';
import { getARTsForWorker } from '../art/art.service';
import { getFindingIncidents } from '../findingIncidents/findingIncident.service';
import type { Worker } from './worker.service';

export type WorkerDetailData = {
  worker: Worker;
  irls: any[];
  talks: any[];
  fitForWork: any[];
  art: any[];
  findingIncidents: any[];
  loading: boolean;
  error: string | null;
};

export async function getWorkerCompleteData(workerId: string): Promise<Omit<WorkerDetailData, 'loading' | 'error'>> {
  try {
    const [worker, irls, talks, fitForWork, art, findingIncidents] = await Promise.all([
      getWorkerById(workerId),
      getIRLsForWorker(workerId),
      getTalksForWorker(workerId),
      getFitForWorkForWorker(workerId),
      getARTsForWorker(workerId),
      getFindingIncidents()
    ]);

    if (!worker) {
      throw new Error('Trabajador no encontrado');
    }

    // Filtrar finding incidents por trabajador si es necesario
    const workerFindingIncidents = findingIncidents.filter(incident => 
      incident.personasInvolucradas?.includes(workerId) || 
      incident.obra === worker.obra
    );

    return {
      worker,
      irls: irls || [],
      talks: talks || [],
      fitForWork: fitForWork || [],
      art: art || [],
      findingIncidents: workerFindingIncidents || []
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error al cargar datos del trabajador');
  }
}

export function getWorkerSignatureStatus(worker: Worker): {
  hasSignedEnrollment: boolean;
  hasIRL: boolean;
  hasAptitud: boolean;
  signatureDate?: Date;
  signatureToken?: string;
  signatureGeo?: { lat: number; lng: number; accuracy?: number };
} {
  return {
    hasSignedEnrollment: !!worker.enrolamientoFirmadoEn,
    hasIRL: !!worker.irlAdjunto,
    hasAptitud: !!worker.aptitudAdjunto,
    signatureDate: worker.enrolamientoFirmadoEn,
    signatureToken: worker.enrolamientoToken,
    signatureGeo: worker.enrolamientoGeo
  };
}

export function getDocumentSignaturesSummary(): {
  total: number;
  signed: number;
  pending: number;
  signedDocuments: Array<{
    documentTitle: string;
    signedDate: Date;
    signedBy: string;
    geo?: { lat: number; lng: number; accuracy?: number };
  }>;
} {
  return {
    total: 0,
    signed: 0,
    pending: 0,
    signedDocuments: [],
  };
}
