/**
 * UTILITAIRE: Fusion de classes CSS
 * 
 * Utilitaire pour combiner les classes CSS avec clsx et tailwind-merge
 * Permet de gérer les conflits de classes Tailwind de manière intelligente
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine et optimise les classes CSS
 * Utilise clsx pour la logique conditionnelle et tailwind-merge pour résoudre les conflits
 * 
 * @param inputs - Classes CSS à combiner
 * @returns Classes CSS optimisées
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default cn;
