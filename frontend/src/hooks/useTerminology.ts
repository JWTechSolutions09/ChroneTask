import { useUserUsageType } from "./useUserUsageType";

export interface Terminology {
  // Singular
  organization: string;
  organizationLower: string;
  // Plural
  organizations: string;
  organizationsLower: string;
  // Verbos y acciones
  createOrganization: string;
  manageOrganizations: string;
  selectOrganization: string;
  selectAnOrganization: string;
  noOrganizations: string;
  noOrganizationsMessage: string;
  createFirstOrganization: string;
  organizationCreated: string;
  organizationDeleted: string;
  organizationSelected: string;
  loadingOrganizations: string;
  errorLoadingOrganizations: string;
  errorCreatingOrganization: string;
  errorDeletingOrganization: string;
  deleteOrganization: string;
  deleteOrganizationConfirm: string;
  organizationMembers: string;
  inviteMembersToOrganization: string;
  viewOrganizationMembers: string;
  myOrganizations: string;
  organizationsAvailable: string;
  organizationAvailable: string;
}

export function useTerminology(): Terminology {
  const { usageType } = useUserUsageType();
  const isTeam = usageType === "team";

  if (isTeam) {
    return {
      organization: "Equipo",
      organizationLower: "equipo",
      organizations: "Equipos",
      organizationsLower: "equipos",
      createOrganization: "Crear Nuevo Equipo",
      manageOrganizations: "Gestiona tus equipos",
      selectOrganization: "Selecciona un equipo",
      selectAnOrganization: "Selecciona un equipo",
      noOrganizations: "No tienes equipos",
      noOrganizationsMessage: "Crea tu primer equipo para comenzar a gestionar proyectos y tareas",
      createFirstOrganization: "Crear Equipo",
      organizationCreated: "Equipo creado exitosamente",
      organizationDeleted: "Equipo eliminado exitosamente",
      organizationSelected: "Equipo",
      loadingOrganizations: "Cargando equipos...",
      errorLoadingOrganizations: "Error cargando equipos",
      errorCreatingOrganization: "Error creando equipo",
      errorDeletingOrganization: "Error eliminando equipo",
      deleteOrganization: "Eliminar equipo",
      deleteOrganizationConfirm: "¿Eliminar equipo?",
      organizationMembers: "Miembros del Equipo",
      inviteMembersToOrganization: "Invitar miembros al equipo",
      viewOrganizationMembers: "Ver miembros del equipo",
      myOrganizations: "Mis Equipos",
      organizationsAvailable: "equipos disponibles",
      organizationAvailable: "equipo disponible",
    };
  }

  // Default: business mode
  return {
    organization: "Organización",
    organizationLower: "organización",
    organizations: "Organizaciones",
    organizationsLower: "organizaciones",
    createOrganization: "Crear Nueva Organización",
    manageOrganizations: "Gestiona tus organizaciones",
    selectOrganization: "Selecciona una organización",
    selectAnOrganization: "Selecciona una organización",
    noOrganizations: "No tienes organizaciones",
    noOrganizationsMessage: "Crea tu primera organización para comenzar a gestionar proyectos y tareas",
    createFirstOrganization: "Crear Organización",
    organizationCreated: "Organización creada exitosamente",
    organizationDeleted: "Organización eliminada exitosamente",
    organizationSelected: "Organización",
    loadingOrganizations: "Cargando organizaciones...",
    errorLoadingOrganizations: "Error cargando organizaciones",
    errorCreatingOrganization: "Error creando organización",
    errorDeletingOrganization: "Error eliminando organización",
    deleteOrganization: "Eliminar organización",
    deleteOrganizationConfirm: "¿Eliminar organización?",
    organizationMembers: "Miembros de la Organización",
    inviteMembersToOrganization: "Invitar miembros a la organización",
    viewOrganizationMembers: "Ver miembros de la organización",
    myOrganizations: "Mis Organizaciones",
    organizationsAvailable: "organizaciones disponibles",
    organizationAvailable: "organización disponible",
  };
}
