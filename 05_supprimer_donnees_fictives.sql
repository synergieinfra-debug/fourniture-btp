-- =====================================================================
--  FOURNITURE BTP — Suppression des données FICTIVES de test
--  Efface les sociétés F91-F93 et C901-C902, leurs offres et leur
--  historique, les synonymes qu'elles ont créés, et les consultations
--  rattachées aux clients fictifs (avec leurs lignes et devis).
--  Les comptes éventuellement rattachés à ces sociétés repassent « en attente ».
--  Les propositions d'articles des fournisseurs fictifs sont effacées avec eux.
--  Les fichiers joints aux consultations de test restent dans Storage > pieces :
--  supprimez leurs dossiers à la main depuis le tableau de bord si besoin.
-- =====================================================================
begin;
-- Comptes de test rattachés aux sociétés fictives : remis « en attente »
update public.profils set role = null, societe_id = null
 where societe_id in (select id from public.societes where code in ('F91','F92','F93','C901','C902'));
delete from public.consultations
 where client_id in (select id from public.societes where code in ('C901','C902'));
-- Bons de commande adressés aux fournisseurs fictifs (lot 5) : à effacer avant les sociétés
do $$ begin
  if to_regclass('public.commandes_fournisseur') is not null then
    delete from public.commandes_fournisseur
     where fournisseur_id in (select id from public.societes where code in ('F91','F92','F93'));
  end if;
end $$;
delete from public.synonymes
 where societe_id in (select id from public.societes where code in ('F91','F92','F93','C901','C902'));
delete from public.societes where code in ('F91','F92','F93','C901','C902');
commit;
select count(*) as societes_fictives_restantes from public.societes where raison_sociale like 'FICTIF%';
