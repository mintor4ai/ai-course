export type Answers = Record<string, unknown>

export interface Option {
  value: string
  label: string
  score?: number | null
  isNone?: boolean
}

export interface Question {
  id: string
  column: string
  label: string
  type: 'short_text' | 'email' | 'single_select' | 'multi_select' | 'scale' | 'long_text'
  required: boolean
  options?: Option[]
  conditionalOther?: string
  showIf?: (a: Answers) => boolean
  scoreDimension?: string
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  helpText?: string
  scaleLabels?: Record<number, string>
  highValueOptions?: string[]
}

export interface Section {
  id: string
  title: string
  subtitle?: string
  questions: Question[]
}

const o = (value: string, label: string, score?: number | null, isNone = false): Option => ({
  value, label,
  ...(score !== undefined ? { score } : {}),
  ...(isNone ? { isNone: true } : {}),
})

export const SURVEY_SECTIONS: Section[] = [
  // ── SECTION 1: Perfil ──────────────────────────────────────────────────────
  {
    id: 'profile',
    title: 'Tu perfil',
    subtitle: 'Cuéntanos quién eres antes de comenzar',
    questions: [
      {
        id: 'Q01', column: 'participant_name',
        label: '¿Cuál es tu nombre completo?',
        type: 'short_text', required: true, minLength: 3,
      },
      {
        id: 'Q02', column: 'participant_email',
        label: '¿Cuál es tu correo electrónico?',
        type: 'email', required: true,
      },
      {
        id: 'Q03', column: 'participant_role',
        label: '¿Cuál opción describe mejor tu función actual?',
        type: 'single_select', required: true,
        options: [
          o('developer', 'Desarrollador/a de software'),
          o('architect', 'Arquitecto/a de software o soluciones'),
          o('functional', 'Analista funcional'),
          o('tech_lead', 'Líder técnico'),
          o('other_tech', 'Otro perfil relacionado con tecnología'),
        ],
      },
      {
        id: 'Q04', column: 'technology_experience_range',
        label: '¿Cuántos años de experiencia tienes en funciones relacionadas con tecnología, desarrollo o análisis de sistemas?',
        type: 'single_select', required: true,
        options: [
          o('less_than_2', 'Menos de 2 años'),
          o('2_to_5', 'De 2 a 5 años'),
          o('6_to_10', 'De 6 a 10 años'),
          o('more_than_10', 'Más de 10 años'),
        ],
      },
    ],
  },

  // ── SECTION 2: Uso actual de IA ───────────────────────────────────────────
  {
    id: 'ai_usage',
    title: 'Uso actual de IA',
    subtitle: '¿Cómo integras la IA en tu trabajo hoy?',
    questions: [
      {
        id: 'Q05', column: 'ai_usage_frequency',
        label: '¿Con qué frecuencia utilizas herramientas de inteligencia artificial en tu trabajo?',
        type: 'single_select', required: true,
        scoreDimension: 'ai_adoption',
        options: [
          o('never', 'Nunca las he utilizado', 0),
          o('tried_once_or_twice', 'Las he probado una o dos veces', 1),
          o('monthly', 'Las utilizo algunas veces al mes', 2),
          o('weekly', 'Las utilizo varias veces por semana', 3),
          o('daily', 'Las utilizo diariamente', 4),
          o('embedded_in_workflow', 'Son parte integral de mi flujo de trabajo', 5),
        ],
      },
      {
        id: 'Q06', column: 'ai_tools_used',
        label: '¿Qué herramientas de inteligencia artificial has utilizado?',
        type: 'multi_select', required: true,
        scoreDimension: 'tool_exposure',
        conditionalOther: 'ai_tools_other',
        options: [
          o('microsoft_copilot', 'Microsoft Copilot'),
          o('github_copilot', 'GitHub Copilot'),
          o('chatgpt', 'ChatGPT'),
          o('claude', 'Claude'),
          o('claude_code', 'Claude Code'),
          o('openai_codex', 'OpenAI Codex'),
          o('gemini', 'Gemini'),
          o('cursor', 'Cursor'),
          o('perplexity', 'Perplexity'),
          o('notebooklm', 'NotebookLM'),
          o('google_ai_studio', 'Google AI Studio'),
          o('other', 'Otra'),
          o('none', 'Ninguna', undefined, true),
        ],
      },
      {
        id: 'Q07', column: 'current_ai_use_cases',
        label: '¿Para qué actividades utilizas actualmente la inteligencia artificial?',
        type: 'multi_select', required: true,
        scoreDimension: 'tool_exposure',
        conditionalOther: 'current_ai_use_cases_other',
        options: [
          o('generate_code', 'Generar código'),
          o('explain_code', 'Explicar código existente'),
          o('debug_errors', 'Corregir errores o depurar'),
          o('create_sql', 'Crear consultas SQL'),
          o('refactor_code', 'Refactorizar código'),
          o('generate_tests', 'Generar pruebas'),
          o('document_systems', 'Documentar código o sistemas'),
          o('research_technologies', 'Investigar tecnologías'),
          o('design_architecture', 'Diseñar soluciones o arquitecturas'),
          o('analyze_requirements', 'Analizar requerimientos'),
          o('create_user_stories', 'Crear historias de usuario'),
          o('define_acceptance_criteria', 'Definir criterios de aceptación'),
          o('create_diagrams', 'Preparar diagramas o documentación funcional'),
          o('automate_tasks', 'Automatizar tareas repetitivas'),
          o('analyze_documents', 'Resumir o analizar documentos'),
          o('other', 'Otra'),
          o('none', 'No la utilizo todavía', undefined, true),
        ],
      },
      {
        id: 'Q08', column: 'ai_confidence_level',
        label: '¿Qué nivel de confianza tienes al utilizar IA para resolver una tarea técnica o funcional?',
        type: 'scale', required: true, min: 1, max: 5,
        scoreDimension: 'ai_adoption',
        scaleLabels: {
          1: 'No sé cómo comenzar',
          2: 'Necesito bastante apoyo',
          3: 'Puedo utilizarla en tareas sencillas',
          4: 'Puedo aplicarla en tareas complejas',
          5: 'Puedo diseñar flujos estructurados con IA',
        },
      },
    ],
  },

  // ── SECTION 3: Contexto y requerimientos ─────────────────────────────────
  {
    id: 'context',
    title: 'Contexto y especificación',
    subtitle: '¿Qué tan bien preparas el contexto para la IA?',
    questions: [
      {
        id: 'Q09', column: 'ai_context_elements_provided',
        label: 'Cuando solicitas ayuda a una herramienta de IA, ¿qué información sueles proporcionarle?',
        type: 'multi_select', required: true,
        scoreDimension: 'context_engineering',
        highValueOptions: [
          'task_objective', 'related_code', 'business_rules', 'system_architecture',
          'team_conventions', 'expected_output_examples', 'technical_restrictions',
          'acceptance_criteria', 'required_tests',
        ],
        options: [
          o('short_instruction', 'Una instrucción breve'),
          o('task_objective', 'El objetivo de la tarea'),
          o('related_code', 'Código relacionado'),
          o('error_messages', 'Mensajes de error'),
          o('business_rules', 'Reglas de negocio'),
          o('technology_versions', 'Tecnologías y versiones utilizadas'),
          o('system_architecture', 'Arquitectura o contexto del sistema'),
          o('team_conventions', 'Convenciones del equipo'),
          o('expected_output_examples', 'Ejemplos del resultado esperado'),
          o('technical_restrictions', 'Restricciones técnicas o de seguridad'),
          o('acceptance_criteria', 'Criterios de aceptación'),
          o('required_tests', 'Pruebas que debe cumplir'),
          o('no_structured_context', 'Normalmente no proporciono contexto estructurado', undefined, true),
          o('do_not_use_ai', 'No utilizo IA actualmente', undefined, true),
        ],
      },
      {
        id: 'Q10', column: 'requirements_clarity_level',
        label: 'Cuando recibes un requerimiento funcional, ¿qué tan claro suele estar antes de comenzar el análisis o desarrollo?',
        type: 'single_select', required: true,
        scoreDimension: 'specification_maturity',
        options: [
          o('ambiguous', 'Generalmente está incompleto o es ambiguo', 0),
          o('general_missing_details', 'Tiene una descripción general, pero faltan detalles importantes', 1),
          o('some_rules_and_criteria', 'Incluye reglas de negocio y algunos criterios', 2),
          o('documented_scope_and_acceptance', 'Está documentado con alcance, reglas y criterios de aceptación', 3),
          o('ready_for_technical_plan', 'Está suficientemente estructurado para convertirlo en un plan técnico', 4),
          o('not_applicable', 'No recibo requerimientos funcionales directamente', null),
        ],
      },
      {
        id: 'Q11', column: 'required_specification_elements',
        label: '¿Qué elementos consideras indispensables para que una persona o una herramienta de IA pueda trabajar correctamente con un requerimiento?',
        type: 'multi_select', required: true,
        scoreDimension: 'specification_maturity',
        options: [
          o('requirement_objective', 'Objetivo del requerimiento'),
          o('business_context', 'Contexto del negocio'),
          o('current_flow', 'Flujo actual'),
          o('expected_inputs_outputs', 'Entradas y salidas esperadas'),
          o('business_rules', 'Reglas de negocio'),
          o('affected_systems', 'Sistemas o módulos afectados'),
          o('technical_constraints', 'Restricciones técnicas'),
          o('exception_cases', 'Casos excepcionales'),
          o('acceptance_criteria', 'Criterios de aceptación'),
          o('required_tests', 'Pruebas necesarias'),
          o('expected_output_examples', 'Ejemplos del resultado esperado'),
          o('not_sure', 'No estoy seguro', undefined, true),
        ],
      },
    ],
  },

  // ── SECTION 4: Documentación ──────────────────────────────────────────────
  {
    id: 'documentation',
    title: 'Documentación y repositorios',
    subtitle: '¿Qué tan listos están los proyectos para trabajar con IA?',
    questions: [
      {
        id: 'Q12', column: 'repository_documentation_maturity',
        label: '¿Cómo describirías actualmente la documentación de los repositorios, proyectos o sistemas en los que trabajas?',
        type: 'single_select', required: true,
        scoreDimension: 'documentation_maturity',
        options: [
          o('no_formal_documentation', 'No existe documentación formal', 0),
          o('basic_incomplete_outdated', 'Existe información básica, pero está incompleta o desactualizada', 1),
          o('readme_and_basic_instructions', 'Existe un README y algunas instrucciones técnicas', 2),
          o('main_modules_documented', 'Los principales módulos, procesos y dependencias están documentados', 3),
          o('architecture_and_business_rules_documented', 'La arquitectura, reglas de negocio y operación están documentadas', 4),
          o('documentation_part_of_workflow', 'La documentación está actualizada y forma parte del proceso', 5),
          o('insufficient_visibility', 'No tengo suficiente visibilidad para responder', null),
        ],
      },
      {
        id: 'Q13', column: 'documentation_types_available',
        label: '¿Qué tipos de documentación están disponibles actualmente?',
        type: 'multi_select', required: true,
        scoreDimension: 'documentation_maturity',
        options: [
          o('general_readme', 'README general'),
          o('installation_instructions', 'Instrucciones para instalar o ejecutar el proyecto'),
          o('environment_setup', 'Instrucciones para configurar el ambiente'),
          o('architecture_description', 'Descripción de arquitectura'),
          o('module_documentation', 'Documentación por módulo'),
          o('business_rules_documentation', 'Reglas de negocio'),
          o('data_dictionary', 'Modelo de datos o diccionario de tablas'),
          o('api_documentation', 'Documentación de APIs e integraciones'),
          o('development_conventions', 'Convenciones de desarrollo'),
          o('coding_standards', 'Estándares de código'),
          o('test_cases', 'Casos de prueba'),
          o('deployment_procedures', 'Procedimientos de despliegue'),
          o('architecture_decision_records', 'Registro de decisiones técnicas'),
          o('process_or_architecture_diagrams', 'Diagramas de procesos o arquitectura'),
          o('definition_of_done', 'Definición de terminado'),
          o('no_formal_documentation', 'No existe documentación formal', undefined, true),
          o('not_sure', 'No estoy seguro', undefined, true),
        ],
      },
      {
        id: 'Q14', column: 'primary_system_knowledge_source',
        label: 'Cuando necesitas entender una parte del sistema que no conoces, ¿dónde encuentras normalmente la información?',
        type: 'single_select', required: true,
        scoreDimension: 'documentation_maturity',
        options: [
          o('repository_documentation', 'En la documentación del repositorio', 5),
          o('tickets_or_user_stories', 'En tickets, historias de usuario o requerimientos anteriores', 3),
          o('read_code', 'Revisando directamente el código', 2),
          o('external_documents', 'Consultando documentos externos o carpetas compartidas', 2),
          o('ask_team_member', 'Preguntando a otro integrante del equipo', 1),
          o('test_system_behavior', 'Probando el sistema hasta entender su comportamiento', 1),
          o('multiple_distributed_sources', 'La información está distribuida en varias fuentes', 1),
          o('difficult_to_find', 'Generalmente es difícil encontrarla', 0),
        ],
      },
      {
        id: 'Q15', column: 'documentation_comprehensibility_score',
        label: '¿Qué tan fácil sería para un nuevo integrante o para una herramienta de IA comprender el proyecto utilizando solo la documentación existente?',
        type: 'scale', required: true, min: 1, max: 5,
        scoreDimension: 'documentation_maturity',
        scaleLabels: { 1: 'Prácticamente imposible', 5: 'Comprende el sistema completamente' },
      },
      {
        id: 'Q16', column: 'documentation_update_practice',
        label: '¿Qué sucede normalmente con la documentación cuando se realiza una modificación al sistema?',
        type: 'single_select', required: true,
        scoreDimension: 'documentation_maturity',
        options: [
          o('not_updated', 'No suele actualizarse', 0),
          o('no_defined_process', 'No existe un proceso definido', 0),
          o('updated_on_request', 'Se actualiza solamente cuando alguien lo solicita', 1),
          o('some_documents_updated', 'Se actualizan algunos documentos importantes', 2),
          o('part_of_task_completion', 'La actualización forma parte del cierre de la tarea', 4),
          o('reviewed_against_code', 'Existe revisión para confirmar que código y documentación coincidan', 5),
          o('not_sure', 'No estoy seguro', null),
        ],
      },
      {
        id: 'Q17', column: 'documented_team_rules',
        label: '¿El equipo cuenta con reglas o instrucciones documentadas sobre cómo debe analizarse, modificarse o validarse el código?',
        type: 'multi_select', required: true,
        scoreDimension: 'agent_readiness',
        highValueOptions: [
          'naming_conventions', 'folder_structure', 'architecture_patterns', 'database_rules',
          'error_handling', 'security_and_data_access', 'required_tests', 'code_review',
          'documentation_guidelines', 'definition_of_done',
        ],
        options: [
          o('naming_conventions', 'Convenciones de nombres'),
          o('folder_structure', 'Estructura de carpetas'),
          o('architecture_patterns', 'Patrones de arquitectura'),
          o('database_rules', 'Reglas para consultas y bases de datos'),
          o('error_handling', 'Manejo de errores'),
          o('security_and_data_access', 'Seguridad y acceso a información'),
          o('required_tests', 'Pruebas requeridas'),
          o('code_review', 'Revisión de código'),
          o('documentation_guidelines', 'Lineamientos de documentación'),
          o('definition_of_done', 'Definición de terminado'),
          o('informal_not_documented', 'Existen reglas informales, pero no están documentadas', undefined, true),
          o('no_shared_rules', 'No existen reglas compartidas', undefined, true),
          o('not_sure', 'No estoy seguro', undefined, true),
        ],
      },
    ],
  },

  // ── SECTION 5: Dinámico por rol ───────────────────────────────────────────
  {
    id: 'role_specific',
    title: 'Prioridades de aprendizaje',
    subtitle: '¿Qué quieres lograr con la IA en tu función?',
    questions: [
      {
        id: 'Q18A', column: 'developer_ai_learning_priorities',
        label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial?',
        type: 'multi_select', required: true,
        showIf: (a) => a.participant_role === 'developer',
        options: [
          o('understand_legacy_code', 'Comprender código heredado'),
          o('identify_dependencies', 'Identificar dependencias y relaciones entre módulos'),
          o('generate_new_code', 'Generar código nuevo'),
          o('debug_errors', 'Corregir errores y depurar'),
          o('refactor_code', 'Refactorizar código'),
          o('create_tests', 'Crear pruebas'),
          o('work_with_sql', 'Trabajar con SQL y stored procedures'),
          o('document_changes', 'Documentar modificaciones'),
          o('impact_analysis', 'Analizar el impacto de un cambio'),
          o('pre_integration_code_review', 'Revisar código antes de integrarlo'),
          o('automate_development_tasks', 'Automatizar tareas repetitivas del desarrollo'),
          o('specification_to_technical_plan', 'Convertir una especificación en un plan técnico'),
          o('repository_agents', 'Utilizar agentes sobre un repositorio'),
          o('reusable_skills_and_instructions', 'Crear instrucciones, skills o flujos reutilizables'),
        ],
      },
      {
        id: 'Q18B', column: 'architect_ai_learning_priorities',
        label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial?',
        type: 'multi_select', required: true,
        showIf: (a) => a.participant_role === 'architect',
        options: [
          o('analyze_existing_architecture', 'Analizar la arquitectura existente'),
          o('evaluate_change_impact', 'Evaluar el impacto de un cambio'),
          o('detect_system_dependencies', 'Detectar dependencias entre sistemas'),
          o('document_architecture_decisions', 'Documentar decisiones de arquitectura'),
          o('identify_technical_debt', 'Identificar deuda técnica'),
          o('compare_technology_options', 'Comparar opciones tecnológicas'),
          o('define_development_standards', 'Definir estándares de desarrollo'),
          o('review_technical_designs', 'Revisar diseños técnicos'),
          o('create_diagrams', 'Generar diagramas'),
          o('design_integrations', 'Diseñar integraciones'),
          o('evaluate_technical_risks', 'Evaluar riesgos técnicos'),
          o('repository_instructions', 'Crear instrucciones para repositorios'),
          o('design_ai_agent_workflows', 'Diseñar flujos de agentes IA'),
          o('specialized_skills_and_agents', 'Crear skills y agentes especializados'),
          o('validation_and_approval_mechanisms', 'Definir mecanismos de validación y aprobación'),
        ],
      },
      {
        id: 'Q18C', column: 'tech_lead_ai_learning_priorities',
        label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial?',
        type: 'multi_select', required: true,
        showIf: (a) => a.participant_role === 'tech_lead',
        options: [
          o('improve_team_productivity', 'Mejorar la productividad del equipo'),
          o('standardize_ai_usage', 'Estandarizar el uso de IA en el equipo'),
          o('review_ai_generated_code', 'Revisar código generado por IA'),
          o('define_repository_rules', 'Definir reglas para los repositorios'),
          o('identify_reusable_use_cases', 'Identificar casos de uso reutilizables'),
          o('improve_code_review', 'Mejorar el proceso de revisión de código'),
          o('improve_testing', 'Mejorar el proceso de pruebas'),
          o('document_team_practices', 'Documentar prácticas del equipo'),
          o('measure_ai_value', 'Medir el valor generado por la IA'),
          o('support_legacy_code', 'Apoyar el trabajo con código heredado'),
          o('create_skills_and_agents', 'Crear skills y agentes para el equipo'),
          o('develop_ai_champions', 'Desarrollar AI Champions en el equipo'),
          o('manage_ai_risks', 'Gestionar riesgos del uso de IA'),
          o('improve_requirements_handoff', 'Mejorar el traspaso de requerimientos'),
        ],
      },
      {
        id: 'Q18D', column: 'functional_ai_learning_priorities',
        label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial?',
        type: 'multi_select', required: true,
        showIf: (a) => a.participant_role === 'functional',
        options: [
          o('document_processes', 'Documentar procesos'),
          o('gather_requirements', 'Levantar requerimientos'),
          o('conversation_to_user_stories', 'Convertir conversaciones en historias de usuario'),
          o('define_business_rules', 'Definir reglas de negocio'),
          o('create_acceptance_criteria', 'Crear criterios de aceptación'),
          o('identify_exceptions', 'Identificar casos excepcionales'),
          o('prepare_test_cases', 'Preparar casos de prueba'),
          o('improve_development_communication', 'Mejorar la comunicación con desarrollo'),
          o('analyze_documentation', 'Analizar documentación existente'),
          o('generate_complete_specifications', 'Generar especificaciones completas'),
          o('detect_missing_information', 'Detectar información faltante'),
          o('functional_impact_analysis', 'Análisis de impacto funcional'),
          o('create_process_flows', 'Crear flujos de proceso'),
          o('prepare_ai_context', 'Preparar contexto para herramientas de IA'),
        ],
      },
      {
        id: 'Q18E', column: 'other_role_ai_learning_priorities',
        label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial?',
        type: 'multi_select', required: true,
        showIf: (a) => a.participant_role === 'other_tech',
        options: [
          o('analyze_information', 'Analizar información'),
          o('document_processes', 'Documentar procesos'),
          o('understand_systems', 'Comprender sistemas'),
          o('prepare_requirements', 'Preparar requerimientos'),
          o('generate_documentation', 'Generar documentación'),
          o('research_options', 'Investigar opciones tecnológicas'),
          o('automate_tasks', 'Automatizar tareas'),
          o('improve_cross_team_communication', 'Mejorar comunicación entre equipos'),
          o('prepare_reports', 'Preparar reportes'),
          o('design_solutions', 'Diseñar soluciones'),
          o('validate_results', 'Validar resultados'),
          o('other', 'Otra'),
        ],
      },
    ],
  },

  // ── SECTION 6: Adopción en equipo ─────────────────────────────────────────
  {
    id: 'team_adoption',
    title: 'Adopción en el equipo',
    subtitle: '¿Cómo está usando IA el equipo a tu alrededor?',
    questions: [
      {
        id: 'Q19', column: 'team_ai_adoption_level',
        label: '¿Cuál opción describe mejor la adopción actual de IA dentro de tu equipo?',
        type: 'single_select', required: true,
        scoreDimension: 'team_adoption',
        options: [
          o('not_used', 'No se utiliza', 0),
          o('individual_experimentation', 'Algunas personas están experimentando individualmente', 1),
          o('specific_tasks_no_method', 'Se utiliza en tareas específicas, pero sin metodología común', 2),
          o('some_shared_practices', 'Existen algunas buenas prácticas compartidas', 3),
          o('defined_team_processes', 'El equipo utiliza IA dentro de procesos definidos', 4),
          o('standards_and_validation', 'Tenemos estándares, herramientas y mecanismos de validación', 5),
          o('insufficient_visibility', 'No tengo suficiente visibilidad para responder', null),
        ],
      },
      {
        id: 'Q20', column: 'ai_practice_sharing_behavior',
        label: 'Cuando descubres una forma útil de trabajar con IA, ¿qué haces normalmente?',
        type: 'single_select', required: true,
        scoreDimension: 'ai_leadership',
        options: [
          o('no_useful_cases_yet', 'Todavía no he identificado casos útiles', 0),
          o('individual_use', 'La utilizo de manera individual', 1),
          o('informally_share', 'La comparto informalmente con algunos compañeros', 2),
          o('document_example', 'Documento el ejemplo, instrucción o prompt', 3),
          o('present_to_team', 'La presento al equipo', 4),
          o('convert_to_reusable_practice', 'Ayudo a convertirla en una práctica reutilizable', 5),
          o('incorporate_into_team_process', 'Busco incorporarla al proceso del equipo', 5),
        ],
      },
      {
        id: 'Q21', column: 'primary_ai_adoption_barrier',
        label: '¿Cuál es actualmente la principal barrera para adoptar IA en tu trabajo?',
        type: 'single_select', required: true,
        conditionalOther: 'primary_ai_adoption_barrier_other',
        options: [
          o('lack_of_tool_knowledge', 'No conozco suficientemente las herramientas'),
          o('difficulty_structuring_instructions', 'No sé cómo estructurar buenas instrucciones'),
          o('difficulty_providing_context', 'No sé qué contexto proporcionar'),
          o('unreliable_results', 'Los resultados pueden contener errores'),
          o('difficulty_validating_results', 'No sé cómo validar lo generado'),
          o('insufficient_documentation', 'La documentación disponible es insuficiente'),
          o('security_or_confidentiality', 'Existen restricciones de seguridad o confidencialidad'),
          o('lack_of_access_or_licenses', 'Falta de acceso o licencias'),
          o('lack_of_time', 'Falta de tiempo para experimentar'),
          o('lack_of_guidelines', 'No existen lineamientos claros'),
          o('lack_of_common_method', 'El equipo no tiene una metodología común'),
          o('no_relevant_use_cases', 'No identifico casos de uso relevantes'),
          o('other', 'Otra'),
        ],
      },
    ],
  },

  // ── SECTION 7: Casos reales y expectativas ────────────────────────────────
  {
    id: 'expectations',
    title: 'Tu contexto real',
    subtitle: 'Esto nos ayudará a personalizar los ejercicios del curso',
    questions: [
      {
        id: 'Q22', column: 'frequent_time_consuming_task',
        label: 'Describe una tarea que realizas de manera frecuente y que consume tiempo o esfuerzo.',
        type: 'long_text', required: true, minLength: 30, maxLength: 1000,
        helpText: 'Puede ser una actividad que realizas al menos tres veces por semana o que requiere dos o más horas. No incluyas información confidencial, credenciales ni datos personales.',
      },
      {
        id: 'Q23', column: 'course_value_expectation',
        label: '¿Qué tendría que suceder durante el curso para que consideres que realmente valió la pena?',
        type: 'long_text', required: true, minLength: 20, maxLength: 750,
        helpText: 'Piensa en una capacidad, práctica, resultado o problema que te gustaría poder atender mejor después de la capacitación.',
      },
      {
        id: 'Q24', column: 'post_course_experimentation_readiness',
        label: '¿Qué tan dispuesto estarías a probar una nueva práctica de trabajo con IA después del curso?',
        type: 'scale', required: true, min: 1, max: 5,
        scoreDimension: 'change_readiness',
        scaleLabels: { 1: 'Muy poco dispuesto', 3: 'Neutral', 5: 'Muy dispuesto' },
      },
    ],
  },
]

export const ROLE_LABELS: Record<string, string> = {
  developer: 'Desarrollador/a de software',
  architect: 'Arquitecto/a de software o soluciones',
  functional: 'Analista funcional',
  tech_lead: 'Líder técnico',
  other_tech: 'Otro perfil tecnológico',
}
