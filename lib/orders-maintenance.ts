/**
 * Coupe-circuit temporaire des commandes, indépendant du mode maintenance
 * global (`MAINTENANCE_MODE`) : à activer quand un problème technique
 * empêche l'activation automatique des abonnements (ex. panel GoldenOTT
 * injoignable), pour éviter d'encaisser des paiements qu'on ne peut pas
 * honorer dans l'immédiat.
 *
 * Repasser à `false` (et redéployer) dès que le problème est résolu.
 */
export const ORDERS_DISABLED = false;

export const ORDERS_DISABLED_MESSAGE =
  "Les commandes sont temporairement suspendues en raison d'un problème technique indépendant de notre volonté. Merci de réessayer un peu plus tard — contactez-nous si c'est urgent.";
