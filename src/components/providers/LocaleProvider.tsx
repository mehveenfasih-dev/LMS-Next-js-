"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type Locale = "en" | "fr";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (message: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "library.locale";
const frenchMessages: Record<string, string> = {
  Admin: "Administration",
  Administration: "Administration",
  admin: "administrateur",
  member: "membre",
  "A place to discover": "Un lieu de découverte",
  "14 days": "14 jours",
  "Across the collection": "Dans toute la collection",
  "Ready to borrow": "Prêts à emprunter",
  "Rows per page": "Lignes par page",
  "Member accounts": "Comptes membres",
  "Pending requests": "Demandes en attente",
  "Waiting for review": "En attente d’examen",
  "Switch to dark mode": "Passer en mode sombre",
  "Switch to light mode": "Passer en mode clair",
  "Book Hub is unavailable": "Book Hub est indisponible",
  "Checking access": "Vérification de l’accès",
  "Cover of": "Couverture de",
  "Go to catalog": "Aller au catalogue",
  "Loading the library…": "Chargement de la bibliothèque…",
  "Something went wrong": "Une erreur s’est produite",
  "The page could not be loaded. Try again, or return to the catalog.":
    "La page n’a pas pu être chargée. Réessayez ou retournez au catalogue.",
  "Try again": "Réessayer",
  "We hit an unexpected problem while starting the application.":
    "Un problème inattendu est survenu au démarrage de l’application.",
  Access: "Accès",
  Action: "Action",
  Actions: "Actions",
  Activate: "Activer",
  "Already a member?": "Déjà membre ?",
  "Account created. You can now sign in with your new credentials.":
    "Compte créé. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.",
  "Account details": "Détails du compte",
  Active: "Actif",
  "Active members": "Membres actifs",
  "Add a book": "Ajouter un livre",
  "Add, edit, and track titles in the collection.":
    "Ajoutez, modifiez et suivez les titres de la collection.",
  "All categories": "Toutes les catégories",
  "All copies are checked out": "Tous les exemplaires sont empruntés",
  "All requests": "Toutes les demandes",
  "All statuses": "Tous les statuts",
  Approve: "Approuver",
  Approved: "Approuvée",
  Author: "Auteur",
  Availability: "Disponibilité",
  "Back to catalog": "Retour au catalogue",
  BCE: "av. J.-C.",
  Book: "Livre",
  "Book added to the catalog.": "Livre ajouté au catalogue.",
  "Book catalog": "Catalogue des livres",
  "Book details": "Détails du livre",
  "Book details updated.": "Détails du livre mis à jour.",
  "Book inventory": "Inventaire des livres",
  "Book removed from the catalog.": "Livre retiré du catalogue.",
  "Books by category": "Livres par catégorie",
  "Borrowing requests recorded in the database.": "Demandes d’emprunt enregistrées dans la base de données.",
  Breadcrumb: "Fil d’Ariane",
  Books: "Livres",
  "Borrowing history": "Historique des emprunts",
  "Borrowing requests": "Demandes d’emprunt",
  "Book Hub · Read widely, return often.":
    "Book Hub · Lisez beaucoup, revenez souvent.",
  "Browse books": "Parcourir les livres",
  "Browse the catalog": "Parcourir le catalogue",
  "books in the collection": "livres dans la collection",
  by: "par",
  Cancel: "Annuler",
  Catalog: "Catalogue",
  Category: "Catégorie",
  Classics: "Classiques",
  "Clear filters": "Effacer les filtres",
  "Collection and circulation at a glance.":
    "Aperçu de la collection et des emprunts.",
  "copies available": "exemplaires disponibles",
  "Could not complete sign in.": "Impossible de se connecter.",
  "Continue with Google": "Continuer avec Google",
  "Email or password is incorrect.": "L’adresse courriel ou le mot de passe est incorrect.",
  "Sign in succeeded but no session was returned.":
    "La connexion a réussi, mais aucune session n’a été retournée.",
  "Your Google access token could not be refreshed. Sign in with Google again to reconnect.":
    "Le jeton d’accès Google n’a pas pu être renouvelé. Reconnectez-vous avec Google.",
  "Or continue with": "Ou continuer avec",
  "Sign out before creating a new member account.":
    "Déconnectez-vous avant de créer un nouveau compte membre.",
  "Enter a name between 2 and 80 characters.":
    "Saisissez un nom de 2 à 80 caractères.",
  "Enter a valid email address.":
    "Saisissez une adresse courriel valide.",
  "Use a password between 8 and 128 characters.":
    "Utilisez un mot de passe de 8 à 128 caractères.",
  "An account with this email already exists.":
    "Un compte avec cette adresse courriel existe déjà.",
  "Could not create your account. Please try again.":
    "Impossible de créer votre compte. Veuillez réessayer.",
  "Could not remove this book.": "Impossible de supprimer ce livre.",
  "Could not request this book.": "Impossible de demander ce livre.",
  "Could not save this book.": "Impossible d’enregistrer ce livre.",
  "Could not update the request.": "Impossible de mettre à jour la demande.",
  "Could not update this member.": "Impossible de mettre à jour ce membre.",
  cancelled: "annulée",
  "No category data is available.": "Aucune donnée de catégorie n’est disponible.",
  "Copies available": "Exemplaires disponibles",
  "Core borrowing rules for the Book Hub collection.":
    "Règles principales d’emprunt de la bibliothèque Book Hub.",
  "Create an account": "Créer un compte",
  "Create member account": "Créer un compte membre",
  "Create a member account to request books from our collection.":
    "Créez un compte membre pour demander des livres de notre collection.",
  "Creating account…": "Création du compte…",
  "Currently unavailable": "Actuellement indisponible",
  Dashboard: "Tableau de bord",
  Decline: "Refuser",
  Delete: "Supprimer",
  Description: "Description",
  Disable: "Désactiver",
  "Discover books": "Découvrir les livres",
  "Due date": "Date de retour",
  Edit: "Modifier",
  "Edit book": "Modifier le livre",
  Email: "Courriel",
  "Email address": "Adresse courriel",
  Enable: "Activer",
  Fiction: "Fiction",
  "Find a book that": "Trouvez un livre qui",
  "Filter by category": "Filtrer par catégorie",
  "Full name": "Nom complet",
  "Go to sign in": "Aller à la connexion",
  "Here's what's happening across your library today.":
    "Voici ce qui se passe aujourd’hui dans votre bibliothèque.",
  "Inactive": "Inactif",
  History: "Histoire",
  Home: "Accueil",
  ISBN: "ISBN",
  "Join the library": "Rejoindre la bibliothèque",
  Joined: "Inscrit le",
  "Keep track of your current and past loans.":
    "Suivez vos emprunts en cours et passés.",
  "Latest borrowing activity": "Activité récente des emprunts",
  LENGTH: "LONGUEUR",
  "Library administration": "Administration de la bibliothèque",
  "Library administrator": "Administrateur de la bibliothèque",
  "Library member": "Membre de la bibliothèque",
  "Library members": "Membres de la bibliothèque",
  "Loan policy": "Politique de prêt",
  "Manage books": "Gérer les livres",
  "Manage member accounts and library access.":
    "Gérez les comptes membres et l’accès à la bibliothèque.",
  "Manage your library membership.": "Gérez votre adhésion à la bibliothèque.",
  "Mark returned": "Marquer comme rendu",
  Member: "Membre",
  "Member account activated.": "Compte membre activé.",
  "Member account deactivated.": "Compte membre désactivé.",
  "Member limit": "Limite par membre",
  "Member since": "Membre depuis",
  Members: "Membres",
  "MEMBER SPACE": "ESPACE MEMBRE",
  "MEMBER SINCE": "MEMBRE DEPUIS",
  "My profile": "Mon profil",
  "Monthly activity chart": "Graphique de l’activité mensuelle",
  "Monthly borrowing activity": "Activité mensuelle des emprunts",
  "My requests": "Mes demandes",
  Name: "Nom",
  "NAME": "NOM",
  "New to Book Hub?": "Nouveau sur Book Hub ?",
  "No books found": "Aucun livre trouvé",
  "No borrowing activity yet.": "Aucune activité d’emprunt pour le moment.",
  "No members match": "Aucun membre ne correspond",
  "One renewal, when no other member is waiting":
    "Un renouvellement si aucun autre membre n’attend",
  "Open navigation": "Ouvrir la navigation",
  "Open navigation menu": "Ouvrir le menu de navigation",
  "of": "sur",
  overdue: "en retard",
  Pages: "Pages",
  Password: "Mot de passe",
  pending: "en attente",
  Pending: "En attente",
  "Personal Growth": "Développement personnel",
  "Please wait…": "Veuillez patienter…",
  "Publication year": "Année de publication",
  PUBLISHER: "ÉDITEUR",
  Publisher: "Éditeur",
  Published: "Publié",
  Rejected: "Refusée",
  rejected: "refusée",
  "Refreshing catalog": "Actualisation du catalogue",
  Reports: "Rapports",
  "Request": "Demande",
  "Request has been sent": "Votre demande a été envoyée",
  "Request this book": "Demander ce livre",
  Requested: "Demandé le",
  Requests: "Demandes",
  Renewals: "Renouvellements",
  returned: "rendu",
  Returned: "Rendu",
  "Review member requests and manage book returns.":
    "Examinez les demandes des membres et gérez les retours de livres.",
  "Review requests and keep the collection moving.":
    "Examinez les demandes et faites vivre la collection.",
  Role: "Rôle",
  "Sample circulation report. Connect an API to use live data.":
    "Exemple de rapport de circulation. Connectez une API pour utiliser les données en direct.",
  Science: "Sciences",
  "Search books": "Rechercher des livres",
  "Search by title, author, or ISBN": "Rechercher par titre, auteur ou ISBN",
  "Search members": "Rechercher des membres",
  "Search members and manage account access.":
    "Recherchez des membres et gérez l’accès aux comptes.",
  "Sending request…": "Envoi de la demande…",
  Settings: "Paramètres",
  "Sign in": "Se connecter",
  "Sign in as a member to request this title.":
    "Connectez-vous en tant que membre pour demander ce livre.",
  "Sign in to manage your books and borrowing requests.":
    "Connectez-vous pour gérer vos livres et vos demandes d’emprunt.",
  "Sign out": "Se déconnecter",
  "stays with you.": "vous accompagne.",
  "Standard loan period": "Durée standard du prêt",
  Status: "Statut",
  "Stay on top of requests from your members.":
    "Suivez les demandes de vos membres.",
  "The book will be removed from the catalog. This action cannot be undone.":
    "Le livre sera supprimé du catalogue. Cette action est irréversible.",
  "There are no requests with this status.":
    "Aucune demande avec ce statut.",
  "These sample policies are informational. Configure enforcement in your library API.":
    "Ces politiques sont fournies à titre indicatif. Configurez leur application dans l’API de votre bibliothèque.",
  Title: "Titre",
  "titles in the catalog": "titres au catalogue",
  "Titles in catalog": "Titres au catalogue",
  "Total copies": "Nombre total d’exemplaires",
  "Track the status and due dates of your books.":
    "Suivez le statut et les dates de retour de vos livres.",
  "Try a different title, author, or category.":
    "Essayez un autre titre, auteur ou une autre catégorie.",
  "Up to 5 active loans": "Jusqu’à 5 prêts actifs",
  "View all requests": "Voir toutes les demandes",
  "View details for": "Voir les détails de",
  "Welcome back": "Bon retour",
  "WELCOME TO BOOK HUB": "BIENVENUE CHEZ BOOK HUB",
  "Your borrowing history": "Historique de vos emprunts",
  "Your next chapter starts here": "Votre prochain chapitre commence ici",
  "May": "Mai",
  "Jun": "Juin",
  "Jul": "Juillet",
  "Aug": "Août",
  "Sep": "Septembre",
  "Oct": "Octobre",
  "Your reading list is empty for now. Find a book to get started.":
    "Votre liste de lecture est vide pour le moment. Choisissez un livre pour commencer.",
  "Your request has been sent.": "Votre demande a été envoyée.",
  "You do not have any requests with this status yet.":
    "Vous n’avez pas encore de demande avec ce statut.",
  active: "actif",
  available: "disponibles",
  pages: "pages",
  "Remove book": "Retirer le livre",
  Deactivate: "Désactiver",
  "Loading book": "Chargement du livre",
  Overdue: "En retard",
  "Switch to French": "Passer en français",
  "Switch to English": "Passer en anglais",
};

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedLocale = window.localStorage.getItem(STORAGE_KEY);
      if (savedLocale === "en" || savedLocale === "fr") {
        setLocale(savedLocale);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, ready]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((current) => (current === "en" ? "fr" : "en"));
  }, []);
  const t = useCallback(
    (message: string) =>
      locale === "fr" ? frenchMessages[message] ?? message : message,
    [locale],
  );
  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, t, toggleLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider.");
  }
  return context;
}
