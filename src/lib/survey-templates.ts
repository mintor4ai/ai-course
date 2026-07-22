/**
 * Built-in survey templates — always available in the Designer template picker.
 * These are NOT stored in DB; they live here so they can't be accidentally deleted.
 */
import type { SurveyConfigJSON } from './survey-config-json'

// ─────────────────────────────────────────────────────────────────────────────
// Template 1: Desarrolladores de Software (24 preguntas, 7 secciones)
// La encuesta "AI Adoption & Leadership Pulse" original para equipos de ingeniería.
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATE_DEVELOPERS: SurveyConfigJSON = {
  version: 1,
  generatedAt: '2025-06-01T00:00:00.000Z',
  promptUsed: 'Plantilla oficial: AI Adoption & Leadership Pulse — Desarrolladores de Software',
  sections: [
    {
      id: 'profile',
      title: 'Tu perfil',
      subtitle: 'Cuéntanos quién eres antes de comenzar',
      questions: [
        { id: 'Q01', column: 'participant_name', label: '¿Cuál es tu nombre completo?', type: 'short_text', required: true, minLength: 3 },
        { id: 'Q02', column: 'participant_email', label: '¿Cuál es tu correo electrónico?', type: 'email', required: true },
        {
          id: 'Q03', column: 'participant_role', label: '¿Cuál opción describe mejor tu función actual?', type: 'single_select', required: true,
          options: [
            { value: 'developer', label: 'Desarrollador/a de software' },
            { value: 'architect', label: 'Arquitecto/a de software o soluciones' },
            { value: 'functional', label: 'Analista funcional' },
            { value: 'tech_lead', label: 'Líder técnico' },
            { value: 'other_tech', label: 'Otro perfil relacionado con tecnología' },
          ],
        },
        {
          id: 'Q04', column: 'technology_experience_range', label: '¿Cuántos años de experiencia tienes en funciones relacionadas con tecnología, desarrollo o análisis de sistemas?', type: 'single_select', required: true,
          options: [
            { value: 'less_than_2', label: 'Menos de 2 años' },
            { value: '2_to_5', label: 'De 2 a 5 años' },
            { value: '6_to_10', label: 'De 6 a 10 años' },
            { value: 'more_than_10', label: 'Más de 10 años' },
          ],
        },
      ],
    },
    {
      id: 'ai_usage',
      title: 'Uso actual de IA',
      subtitle: '¿Cómo integras la IA en tu trabajo hoy?',
      questions: [
        {
          id: 'Q05', column: 'ai_usage_frequency', label: '¿Con qué frecuencia utilizas herramientas de inteligencia artificial en tu trabajo?', type: 'single_select', required: true, scoreDimension: 'ai_adoption',
          options: [
            { value: 'never', label: 'Nunca las he utilizado', score: 0 },
            { value: 'tried_once_or_twice', label: 'Las he probado una o dos veces', score: 1 },
            { value: 'monthly', label: 'Las utilizo algunas veces al mes', score: 2 },
            { value: 'weekly', label: 'Las utilizo varias veces por semana', score: 3 },
            { value: 'daily', label: 'Las utilizo diariamente', score: 4 },
            { value: 'embedded_in_workflow', label: 'Son parte integral de mi flujo de trabajo', score: 5 },
          ],
        },
        {
          id: 'Q06', column: 'ai_tools_used', label: '¿Qué herramientas de inteligencia artificial has utilizado?', type: 'multi_select', required: true, scoreDimension: 'tool_exposure',
          highValueOptions: ['microsoft_copilot', 'github_copilot', 'chatgpt', 'claude', 'claude_code', 'openai_codex', 'gemini', 'cursor', 'google_ai_studio'],
          options: [
            { value: 'microsoft_copilot', label: 'Microsoft Copilot' },
            { value: 'github_copilot', label: 'GitHub Copilot' },
            { value: 'chatgpt', label: 'ChatGPT' },
            { value: 'claude', label: 'Claude' },
            { value: 'claude_code', label: 'Claude Code' },
            { value: 'openai_codex', label: 'OpenAI Codex' },
            { value: 'gemini', label: 'Gemini' },
            { value: 'cursor', label: 'Cursor' },
            { value: 'perplexity', label: 'Perplexity' },
            { value: 'notebooklm', label: 'NotebookLM' },
            { value: 'google_ai_studio', label: 'Google AI Studio' },
            { value: 'other', label: 'Otra' },
            { value: 'none', label: 'Ninguna', isNone: true },
          ],
        },
        {
          id: 'Q07', column: 'current_ai_use_cases', label: '¿Para qué actividades utilizas actualmente la inteligencia artificial?', type: 'multi_select', required: true, scoreDimension: 'tool_exposure',
          options: [
            { value: 'generate_code', label: 'Generar código' },
            { value: 'explain_code', label: 'Explicar código existente' },
            { value: 'debug_errors', label: 'Corregir errores o depurar' },
            { value: 'create_sql', label: 'Crear consultas SQL' },
            { value: 'refactor_code', label: 'Refactorizar código' },
            { value: 'generate_tests', label: 'Generar pruebas' },
            { value: 'document_systems', label: 'Documentar código o sistemas' },
            { value: 'research_technologies', label: 'Investigar tecnologías' },
            { value: 'design_architecture', label: 'Diseñar soluciones o arquitecturas' },
            { value: 'analyze_requirements', label: 'Analizar requerimientos' },
            { value: 'create_user_stories', label: 'Crear historias de usuario' },
            { value: 'define_acceptance_criteria', label: 'Definir criterios de aceptación' },
            { value: 'create_diagrams', label: 'Preparar diagramas o documentación funcional' },
            { value: 'automate_tasks', label: 'Automatizar tareas repetitivas' },
            { value: 'analyze_documents', label: 'Resumir o analizar documentos' },
            { value: 'other', label: 'Otra' },
            { value: 'none', label: 'No la utilizo todavía', isNone: true },
          ],
        },
        {
          id: 'Q08', column: 'ai_confidence_level', label: '¿Qué nivel de confianza tienes al utilizar IA para resolver una tarea técnica o funcional?', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'ai_adoption',
          scaleLabels: { '1': 'No sé cómo comenzar', '3': 'Puedo usarla en tareas sencillas', '5': 'Diseño flujos estructurados' },
        },
      ],
    },
    {
      id: 'context',
      title: 'Contexto y especificación',
      subtitle: '¿Qué tan bien preparas el contexto para la IA?',
      questions: [
        {
          id: 'Q09', column: 'ai_context_elements_provided', label: 'Cuando solicitas ayuda a una herramienta de IA, ¿qué información sueles proporcionarle?', type: 'multi_select', required: true, scoreDimension: 'context_engineering',
          highValueOptions: ['task_objective', 'related_code', 'business_rules', 'system_architecture', 'team_conventions', 'expected_output_examples', 'technical_restrictions', 'acceptance_criteria', 'required_tests'],
          options: [
            { value: 'short_instruction', label: 'Una instrucción breve' },
            { value: 'task_objective', label: 'El objetivo de la tarea' },
            { value: 'related_code', label: 'Código relacionado' },
            { value: 'error_messages', label: 'Mensajes de error' },
            { value: 'business_rules', label: 'Reglas de negocio' },
            { value: 'technology_versions', label: 'Tecnologías y versiones utilizadas' },
            { value: 'system_architecture', label: 'Arquitectura o contexto del sistema' },
            { value: 'team_conventions', label: 'Convenciones del equipo' },
            { value: 'expected_output_examples', label: 'Ejemplos del resultado esperado' },
            { value: 'technical_restrictions', label: 'Restricciones técnicas o de seguridad' },
            { value: 'acceptance_criteria', label: 'Criterios de aceptación' },
            { value: 'required_tests', label: 'Pruebas que debe cumplir' },
            { value: 'no_structured_context', label: 'Normalmente no proporciono contexto estructurado', isNone: true },
            { value: 'do_not_use_ai', label: 'No utilizo IA actualmente', isNone: true },
          ],
        },
        {
          id: 'Q10', column: 'requirements_clarity_level', label: 'Cuando recibes un requerimiento funcional, ¿qué tan claro suele estar antes de comenzar el análisis o desarrollo?', type: 'single_select', required: true, scoreDimension: 'specification_maturity',
          options: [
            { value: 'ambiguous', label: 'Generalmente está incompleto o es ambiguo', score: 0 },
            { value: 'general_missing_details', label: 'Tiene descripción general pero faltan detalles', score: 1 },
            { value: 'some_rules_and_criteria', label: 'Incluye reglas de negocio y algunos criterios', score: 2 },
            { value: 'documented_scope_and_acceptance', label: 'Documentado con alcance, reglas y criterios de aceptación', score: 3 },
            { value: 'ready_for_technical_plan', label: 'Suficientemente estructurado para un plan técnico', score: 4 },
            { value: 'not_applicable', label: 'No recibo requerimientos directamente', score: null },
          ],
        },
        {
          id: 'Q11', column: 'required_specification_elements', label: '¿Qué elementos consideras indispensables para que una persona o herramienta de IA pueda trabajar con un requerimiento?', type: 'multi_select', required: true, scoreDimension: 'specification_maturity',
          options: [
            { value: 'requirement_objective', label: 'Objetivo del requerimiento' },
            { value: 'business_context', label: 'Contexto del negocio' },
            { value: 'current_flow', label: 'Flujo actual' },
            { value: 'expected_inputs_outputs', label: 'Entradas y salidas esperadas' },
            { value: 'business_rules', label: 'Reglas de negocio' },
            { value: 'affected_systems', label: 'Sistemas o módulos afectados' },
            { value: 'technical_constraints', label: 'Restricciones técnicas' },
            { value: 'exception_cases', label: 'Casos excepcionales' },
            { value: 'acceptance_criteria', label: 'Criterios de aceptación' },
            { value: 'required_tests', label: 'Pruebas necesarias' },
            { value: 'expected_output_examples', label: 'Ejemplos del resultado esperado' },
            { value: 'not_sure', label: 'No estoy seguro', isNone: true },
          ],
        },
      ],
    },
    {
      id: 'documentation',
      title: 'Documentación y repositorios',
      subtitle: '¿Qué tan listos están los proyectos para trabajar con IA?',
      questions: [
        {
          id: 'Q12', column: 'repository_documentation_maturity', label: '¿Cómo describirías la documentación de los repositorios o sistemas en los que trabajas?', type: 'single_select', required: true, scoreDimension: 'documentation_maturity',
          options: [
            { value: 'no_formal_documentation', label: 'No existe documentación formal', score: 0 },
            { value: 'basic_incomplete_outdated', label: 'Existe información básica, incompleta o desactualizada', score: 1 },
            { value: 'readme_and_basic_instructions', label: 'Existe README y algunas instrucciones técnicas', score: 2 },
            { value: 'main_modules_documented', label: 'Principales módulos, procesos y dependencias documentados', score: 3 },
            { value: 'architecture_and_business_rules_documented', label: 'Arquitectura, reglas de negocio y operación documentadas', score: 4 },
            { value: 'documentation_part_of_workflow', label: 'Documentación actualizada y parte del proceso', score: 5 },
            { value: 'insufficient_visibility', label: 'No tengo suficiente visibilidad para responder', score: null },
          ],
        },
        {
          id: 'Q13', column: 'documentation_types_available', label: '¿Qué tipos de documentación están disponibles actualmente?', type: 'multi_select', required: true, scoreDimension: 'documentation_maturity',
          highValueOptions: ['architecture_description', 'module_documentation', 'business_rules_documentation', 'data_dictionary', 'api_documentation', 'development_conventions', 'coding_standards', 'test_cases', 'deployment_procedures', 'architecture_decision_records', 'process_or_architecture_diagrams', 'definition_of_done'],
          options: [
            { value: 'general_readme', label: 'README general' },
            { value: 'installation_instructions', label: 'Instrucciones de instalación' },
            { value: 'architecture_description', label: 'Descripción de arquitectura' },
            { value: 'module_documentation', label: 'Documentación por módulo' },
            { value: 'business_rules_documentation', label: 'Reglas de negocio' },
            { value: 'data_dictionary', label: 'Modelo de datos o diccionario' },
            { value: 'api_documentation', label: 'Documentación de APIs' },
            { value: 'development_conventions', label: 'Convenciones de desarrollo' },
            { value: 'coding_standards', label: 'Estándares de código' },
            { value: 'test_cases', label: 'Casos de prueba' },
            { value: 'deployment_procedures', label: 'Procedimientos de despliegue' },
            { value: 'architecture_decision_records', label: 'Registro de decisiones técnicas' },
            { value: 'process_or_architecture_diagrams', label: 'Diagramas de procesos o arquitectura' },
            { value: 'definition_of_done', label: 'Definición de terminado' },
            { value: 'no_formal_documentation', label: 'No existe documentación formal', isNone: true },
          ],
        },
        {
          id: 'Q14', column: 'primary_system_knowledge_source', label: 'Cuando necesitas entender una parte del sistema que no conoces, ¿dónde encuentras la información?', type: 'single_select', required: true, scoreDimension: 'documentation_maturity',
          options: [
            { value: 'repository_documentation', label: 'En la documentación del repositorio', score: 5 },
            { value: 'tickets_or_user_stories', label: 'En tickets o historias de usuario anteriores', score: 3 },
            { value: 'read_code', label: 'Revisando directamente el código', score: 2 },
            { value: 'external_documents', label: 'Consultando documentos externos', score: 2 },
            { value: 'ask_team_member', label: 'Preguntando a otro integrante del equipo', score: 1 },
            { value: 'test_system_behavior', label: 'Probando el sistema hasta entenderlo', score: 1 },
            { value: 'difficult_to_find', label: 'Generalmente es difícil encontrarla', score: 0 },
          ],
        },
        {
          id: 'Q15', column: 'documentation_comprehensibility_score', label: '¿Qué tan fácil sería para un nuevo integrante o IA comprender el proyecto solo con la documentación?', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'documentation_maturity',
          scaleLabels: { '1': 'Prácticamente imposible', '5': 'Comprende el sistema completamente' },
        },
        {
          id: 'Q16', column: 'documentation_update_practice', label: '¿Qué sucede con la documentación cuando se modifica el sistema?', type: 'single_select', required: true, scoreDimension: 'documentation_maturity',
          options: [
            { value: 'not_updated', label: 'No suele actualizarse', score: 0 },
            { value: 'no_defined_process', label: 'No existe un proceso definido', score: 0 },
            { value: 'updated_on_request', label: 'Se actualiza solo cuando alguien lo solicita', score: 1 },
            { value: 'some_documents_updated', label: 'Se actualizan algunos documentos importantes', score: 2 },
            { value: 'part_of_task_completion', label: 'La actualización forma parte del cierre de tarea', score: 4 },
            { value: 'reviewed_against_code', label: 'Hay revisión para confirmar que código y docs coincidan', score: 5 },
          ],
        },
        {
          id: 'Q17', column: 'documented_team_rules', label: '¿El equipo tiene reglas documentadas sobre cómo analizar, modificar o validar el código?', type: 'multi_select', required: true, scoreDimension: 'agent_readiness',
          highValueOptions: ['naming_conventions', 'folder_structure', 'architecture_patterns', 'database_rules', 'error_handling', 'security_and_data_access', 'required_tests', 'code_review', 'documentation_guidelines', 'definition_of_done'],
          options: [
            { value: 'naming_conventions', label: 'Convenciones de nombres' },
            { value: 'folder_structure', label: 'Estructura de carpetas' },
            { value: 'architecture_patterns', label: 'Patrones de arquitectura' },
            { value: 'database_rules', label: 'Reglas para bases de datos' },
            { value: 'error_handling', label: 'Manejo de errores' },
            { value: 'security_and_data_access', label: 'Seguridad y acceso a información' },
            { value: 'required_tests', label: 'Pruebas requeridas' },
            { value: 'code_review', label: 'Revisión de código' },
            { value: 'documentation_guidelines', label: 'Lineamientos de documentación' },
            { value: 'definition_of_done', label: 'Definición de terminado' },
            { value: 'informal_not_documented', label: 'Existen reglas informales pero no documentadas', isNone: true },
            { value: 'no_shared_rules', label: 'No existen reglas compartidas', isNone: true },
          ],
        },
      ],
    },
    {
      id: 'role_specific',
      title: 'Prioridades de aprendizaje',
      subtitle: '¿Qué quieres lograr con la IA en tu función?',
      questions: [
        {
          id: 'Q18A', column: 'developer_ai_learning_priorities', label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial? (Desarrollador)', type: 'multi_select', required: true,
          showIfColumn: 'participant_role', showIfValue: 'developer',
          options: [
            { value: 'understand_legacy_code', label: 'Comprender código heredado' },
            { value: 'identify_dependencies', label: 'Identificar dependencias entre módulos' },
            { value: 'generate_new_code', label: 'Generar código nuevo' },
            { value: 'debug_errors', label: 'Corregir errores y depurar' },
            { value: 'refactor_code', label: 'Refactorizar código' },
            { value: 'create_tests', label: 'Crear pruebas' },
            { value: 'work_with_sql', label: 'Trabajar con SQL y stored procedures' },
            { value: 'document_changes', label: 'Documentar modificaciones' },
            { value: 'impact_analysis', label: 'Analizar el impacto de un cambio' },
            { value: 'pre_integration_code_review', label: 'Revisar código antes de integrarlo' },
            { value: 'automate_development_tasks', label: 'Automatizar tareas repetitivas del desarrollo' },
            { value: 'specification_to_technical_plan', label: 'Convertir especificación en plan técnico' },
            { value: 'repository_agents', label: 'Utilizar agentes sobre un repositorio' },
            { value: 'reusable_skills_and_instructions', label: 'Crear instrucciones, skills o flujos reutilizables' },
          ],
        },
        {
          id: 'Q18B', column: 'architect_ai_learning_priorities', label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial? (Arquitecto)', type: 'multi_select', required: true,
          showIfColumn: 'participant_role', showIfValue: 'architect',
          options: [
            { value: 'analyze_existing_architecture', label: 'Analizar la arquitectura existente' },
            { value: 'evaluate_change_impact', label: 'Evaluar el impacto de un cambio' },
            { value: 'detect_system_dependencies', label: 'Detectar dependencias entre sistemas' },
            { value: 'document_architecture_decisions', label: 'Documentar decisiones de arquitectura' },
            { value: 'identify_technical_debt', label: 'Identificar deuda técnica' },
            { value: 'compare_technology_options', label: 'Comparar opciones tecnológicas' },
            { value: 'define_development_standards', label: 'Definir estándares de desarrollo' },
            { value: 'create_diagrams', label: 'Generar diagramas' },
            { value: 'design_integrations', label: 'Diseñar integraciones' },
            { value: 'design_ai_agent_workflows', label: 'Diseñar flujos de agentes IA' },
          ],
        },
        {
          id: 'Q18C', column: 'tech_lead_ai_learning_priorities', label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial? (Tech Lead)', type: 'multi_select', required: true,
          showIfColumn: 'participant_role', showIfValue: 'tech_lead',
          options: [
            { value: 'improve_team_productivity', label: 'Mejorar la productividad del equipo' },
            { value: 'standardize_ai_usage', label: 'Estandarizar el uso de IA en el equipo' },
            { value: 'review_ai_generated_code', label: 'Revisar código generado por IA' },
            { value: 'define_repository_rules', label: 'Definir reglas para los repositorios' },
            { value: 'improve_code_review', label: 'Mejorar el proceso de revisión de código' },
            { value: 'create_skills_and_agents', label: 'Crear skills y agentes para el equipo' },
            { value: 'develop_ai_champions', label: 'Desarrollar AI Champions en el equipo' },
          ],
        },
        {
          id: 'Q18D', column: 'functional_ai_learning_priorities', label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial? (Funcional)', type: 'multi_select', required: true,
          showIfColumn: 'participant_role', showIfValue: 'functional',
          options: [
            { value: 'document_processes', label: 'Documentar procesos' },
            { value: 'gather_requirements', label: 'Levantar requerimientos' },
            { value: 'conversation_to_user_stories', label: 'Convertir conversaciones en historias de usuario' },
            { value: 'define_business_rules', label: 'Definir reglas de negocio' },
            { value: 'create_acceptance_criteria', label: 'Crear criterios de aceptación' },
            { value: 'identify_exceptions', label: 'Identificar casos excepcionales' },
            { value: 'generate_complete_specifications', label: 'Generar especificaciones completas' },
            { value: 'prepare_ai_context', label: 'Preparar contexto para herramientas de IA' },
          ],
        },
        {
          id: 'Q18E', column: 'other_role_ai_learning_priorities', label: '¿En cuáles actividades te gustaría utilizar mejor la inteligencia artificial?', type: 'multi_select', required: true,
          showIfColumn: 'participant_role', showIfValue: 'other_tech',
          options: [
            { value: 'analyze_information', label: 'Analizar información' },
            { value: 'document_processes', label: 'Documentar procesos' },
            { value: 'understand_systems', label: 'Comprender sistemas' },
            { value: 'prepare_requirements', label: 'Preparar requerimientos' },
            { value: 'generate_documentation', label: 'Generar documentación' },
            { value: 'automate_tasks', label: 'Automatizar tareas' },
            { value: 'prepare_reports', label: 'Preparar reportes' },
            { value: 'design_solutions', label: 'Diseñar soluciones' },
          ],
        },
      ],
    },
    {
      id: 'team_adoption',
      title: 'Adopción en el equipo',
      subtitle: '¿Cómo está usando IA el equipo a tu alrededor?',
      questions: [
        {
          id: 'Q19', column: 'team_ai_adoption_level', label: '¿Cuál opción describe mejor la adopción actual de IA dentro de tu equipo?', type: 'single_select', required: true, scoreDimension: 'team_adoption',
          options: [
            { value: 'not_used', label: 'No se utiliza', score: 0 },
            { value: 'individual_experimentation', label: 'Algunas personas están experimentando individualmente', score: 1 },
            { value: 'specific_tasks_no_method', label: 'Se usa en tareas específicas, sin metodología común', score: 2 },
            { value: 'some_shared_practices', label: 'Existen algunas buenas prácticas compartidas', score: 3 },
            { value: 'defined_team_processes', label: 'El equipo usa IA dentro de procesos definidos', score: 4 },
            { value: 'standards_and_validation', label: 'Tenemos estándares, herramientas y mecanismos de validación', score: 5 },
          ],
        },
        {
          id: 'Q20', column: 'ai_practice_sharing_behavior', label: 'Cuando descubres una forma útil de trabajar con IA, ¿qué haces normalmente?', type: 'single_select', required: true, scoreDimension: 'ai_leadership',
          options: [
            { value: 'no_useful_cases_yet', label: 'Todavía no he identificado casos útiles', score: 0 },
            { value: 'individual_use', label: 'La utilizo de manera individual', score: 1 },
            { value: 'informally_share', label: 'La comparto informalmente con algunos compañeros', score: 2 },
            { value: 'document_example', label: 'Documento el ejemplo, instrucción o prompt', score: 3 },
            { value: 'present_to_team', label: 'La presento al equipo', score: 4 },
            { value: 'convert_to_reusable_practice', label: 'Ayudo a convertirla en una práctica reutilizable', score: 5 },
          ],
        },
        {
          id: 'Q21', column: 'primary_ai_adoption_barrier', label: '¿Cuál es actualmente la principal barrera para adoptar IA en tu trabajo?', type: 'single_select', required: true,
          options: [
            { value: 'lack_of_tool_knowledge', label: 'No conozco suficientemente las herramientas' },
            { value: 'difficulty_structuring_instructions', label: 'No sé cómo estructurar buenas instrucciones' },
            { value: 'difficulty_providing_context', label: 'No sé qué contexto proporcionar' },
            { value: 'unreliable_results', label: 'Los resultados pueden contener errores' },
            { value: 'security_or_confidentiality', label: 'Existen restricciones de seguridad o confidencialidad' },
            { value: 'lack_of_access_or_licenses', label: 'Falta de acceso o licencias' },
            { value: 'lack_of_time', label: 'Falta de tiempo para experimentar' },
            { value: 'lack_of_guidelines', label: 'No existen lineamientos claros' },
            { value: 'no_relevant_use_cases', label: 'No identifico casos de uso relevantes' },
            { value: 'other', label: 'Otra' },
          ],
        },
      ],
    },
    {
      id: 'expectations',
      title: 'Tu contexto real',
      subtitle: 'Esto nos ayudará a personalizar los ejercicios del curso',
      questions: [
        { id: 'Q22', column: 'frequent_time_consuming_task', label: 'Describe una tarea que realizas de manera frecuente y que consume tiempo o esfuerzo.', type: 'long_text', required: true, minLength: 30, maxLength: 1000, helpText: 'Puede ser una actividad que realizas al menos tres veces por semana o que requiere dos o más horas. No incluyas información confidencial.' },
        { id: 'Q23', column: 'course_value_expectation', label: '¿Qué tendría que suceder durante el curso para que consideres que realmente valió la pena?', type: 'long_text', required: true, minLength: 20, maxLength: 750 },
        { id: 'Q24', column: 'post_course_experimentation_readiness', label: '¿Qué tan dispuesto estarías a probar una nueva práctica de trabajo con IA después del curso?', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'change_readiness', scaleLabels: { '1': 'Muy poco dispuesto', '3': 'Neutral', '5': 'Muy dispuesto' } },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 2: Diagnóstico ejecutivo general (versión básica)
// "AI Adoption & Leadership Pulse | Diagnóstico previo (version 1)"
// Diseñada para gerentes, directivos y perfiles no técnicos.
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATE_BASIC: SurveyConfigJSON = {
  version: 1,
  generatedAt: '2025-06-01T00:00:00.000Z',
  promptUsed: 'Plantilla oficial: AI Adoption & Leadership Pulse | Diagnóstico previo (version 1)',
  sections: [
    {
      id: 'profile',
      title: 'Tu perfil',
      subtitle: 'Esta información es confidencial y se usa solo para personalizar el programa.',
      questions: [
        { id: 'B01', column: 'participant_email', label: 'Email', type: 'email', required: true },
        { id: 'B02', column: 'participant_name', label: 'Nombre completo', type: 'short_text', required: true, minLength: 3 },
        { id: 'B03', column: 'puesto', label: 'Puesto', type: 'short_text', required: true },
        { id: 'B04', column: 'area_departamento', label: 'Área o Departamento', type: 'short_text', required: true },
      ],
    },
    {
      id: 'ai_adoption',
      title: 'Adopción y uso de IA',
      subtitle: '¿Cómo estás usando la inteligencia artificial hoy?',
      questions: [
        {
          id: 'B05', column: 'ai_adoption_level', label: 'Nivel actual de adopción de IA en su trabajo', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'ai_adoption',
          scaleLabels: { '1': 'Sin adopción', '2': 'Exploración inicial', '3': 'Uso ocasional', '4': 'Uso con método y criterio', '5': 'Uso estratégico y guía a otros' },
        },
        {
          id: 'B06', column: 'ai_usage_frequency', label: 'Frecuencia de uso de herramientas de IA', type: 'single_select', required: true, scoreDimension: 'ai_adoption',
          options: [
            { value: 'daily', label: 'Diario', score: 5 },
            { value: 'weekly', label: 'Semanal', score: 3 },
            { value: 'monthly', label: 'Mensual', score: 2 },
            { value: 'rarely', label: 'Raramente', score: 1 },
            { value: 'never', label: 'Nunca', score: 0 },
          ],
        },
        {
          id: 'B07', column: 'ai_tools_used', label: '¿Qué herramientas de IA ha utilizado? (Seleccione todas las que apliquen)', type: 'multi_select', required: true, scoreDimension: 'tool_exposure',
          highValueOptions: ['chatgpt', 'copilot', 'gemini', 'claude', 'notebooklm', 'microsoft365'],
          options: [
            { value: 'chatgpt', label: 'ChatGPT' },
            { value: 'copilot', label: 'Copilot' },
            { value: 'gemini', label: 'Gemini' },
            { value: 'perplexity', label: 'Perplexity' },
            { value: 'claude', label: 'Claude' },
            { value: 'notebooklm', label: 'NotebookLM' },
            { value: 'microsoft365', label: 'Herramientas integradas en Microsoft 365' },
            { value: 'none', label: 'Ninguna', isNone: true },
          ],
        },
        {
          id: 'B08', column: 'ai_use_cases', label: '¿Para qué ha usado IA hasta hoy? (Seleccione todas las que apliquen)', type: 'multi_select', required: true, scoreDimension: 'tool_exposure',
          options: [
            { value: 'none', label: 'No aplica, no he usado IA', isNone: true },
            { value: 'redactar_correos', label: 'Redactar correos' },
            { value: 'resumir_informacion', label: 'Resumir información' },
            { value: 'traducir', label: 'Traducir' },
            { value: 'crear_presentaciones', label: 'Crear presentaciones' },
            { value: 'analizar_datos', label: 'Analizar datos' },
            { value: 'crear_reportes', label: 'Crear reportes' },
            { value: 'revisar_documentos', label: 'Revisar documentos' },
            { value: 'generar_ideas', label: 'Generar ideas' },
            { value: 'preparar_juntas', label: 'Preparar juntas' },
            { value: 'automatizar_tareas', label: 'Automatizar tareas' },
          ],
        },
      ],
    },
    {
      id: 'capabilities',
      title: 'Capacidades y hábitos',
      subtitle: '¿Cómo validas y utilizas las respuestas de IA?',
      questions: [
        {
          id: 'B09', column: 'prompt_confidence', label: 'Seguridad para escribir instrucciones claras o prompts', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'context_engineering',
          scaleLabels: { '1': 'Sin confianza', '3': 'Funcional', '5': 'Experto/Estratégico' },
        },
        {
          id: 'B10', column: 'ai_validation_capability', label: 'Capacidad para validar si una respuesta de IA es confiable o riesgosa', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'ai_adoption',
          scaleLabels: { '1': 'Sin capacidad de validación', '3': 'Validación funcional', '5': 'Validación profunda y sistemática' },
        },
        {
          id: 'B11', column: 'ai_response_handling', label: '¿Qué hace normalmente con la primera respuesta de IA?', type: 'single_select', required: true,
          options: [
            { value: 'accept_as_is', label: 'La acepto tal cual', score: 1 },
            { value: 'review_lightly', label: 'La reviso superficialmente', score: 2 },
            { value: 'validate_adjust', label: 'La valido, corrijo y ajusto antes de usarla', score: 5 },
            { value: 'use_as_reference', label: 'La utilizo solo como referencia para hacer desde cero', score: 3 },
            { value: 'no_content_generated', label: 'No he generado contenido con IA', score: 0 },
          ],
        },
      ],
    },
    {
      id: 'work_context',
      title: 'Tu contexto de trabajo',
      subtitle: '¿En qué tareas y documentos te apoyas más?',
      questions: [
        {
          id: 'B12', column: 'time_consuming_tasks', label: 'Tareas que más tiempo consumen (Seleccione todas las que apliquen)', type: 'multi_select', required: true,
          options: [
            { value: 'reportes', label: 'Reportes' },
            { value: 'analisis_excel', label: 'Análisis de Excel' },
            { value: 'seguimiento_pendientes', label: 'Seguimiento de pendientes' },
            { value: 'correos_repetitivos', label: 'Correos repetitivos' },
            { value: 'minutas', label: 'Minutas' },
            { value: 'presentaciones', label: 'Presentaciones' },
            { value: 'revision_contratos', label: 'Revisión de contratos o documentos' },
            { value: 'busqueda_informacion', label: 'Búsqueda de información' },
            { value: 'coordinacion_equipos', label: 'Coordinación con equipos' },
          ],
        },
        { id: 'B13', column: 'frequent_time_consuming_task', label: 'Describe una actividad recurrente que realizas al menos 3 veces por semana o que te tome 2 horas o más semanalmente. Indica qué haces, qué información usas y qué entregable generas.', type: 'long_text', required: true, minLength: 40, maxLength: 1000 },
        {
          id: 'B14', column: 'frequent_documents', label: 'Documentos o insumos usados con frecuencia (Seleccione todos los que apliquen)', type: 'multi_select', required: true,
          options: [
            { value: 'excel_seguimiento', label: 'Excel de seguimiento' },
            { value: 'reportes_direccion', label: 'Reportes para dirección' },
            { value: 'contratos_tipo', label: 'Contratos tipo' },
            { value: 'ordenes_compra', label: 'Órdenes de compra' },
            { value: 'minutas', label: 'Minutas' },
            { value: 'correos_recurrentes', label: 'Correos recurrentes' },
            { value: 'presentaciones', label: 'Presentaciones' },
            { value: 'procedimientos', label: 'Procedimientos' },
            { value: 'bases_datos', label: 'Bases de datos' },
            { value: 'politicas', label: 'Políticas' },
          ],
        },
      ],
    },
    {
      id: 'leadership',
      title: 'Liderazgo y equipo',
      subtitle: '¿Cómo está tu equipo ante la adopción de IA?',
      questions: [
        {
          id: 'B15', column: 'leader_ai_opportunity_readiness', label: 'Preparación como líder para identificar oportunidades de mejora usando IA', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'ai_leadership',
          scaleLabels: { '1': 'Sin preparación', '3': 'Preparación funcional', '5': 'Preparación estratégica y avanzada' },
        },
        {
          id: 'B16', column: 'leader_team_ai_guidance', label: 'Preparación para guiar al equipo en el uso responsable de IA', type: 'scale', required: true, min: 1, max: 5, scoreDimension: 'ai_leadership',
          scaleLabels: { '1': 'Sin preparación', '3': 'Funcional', '5': 'Capacidad de mentoría y guía' },
        },
        {
          id: 'B17', column: 'primary_ai_adoption_barrier', label: 'Principal barrera para adoptar IA en su área', type: 'single_select', required: true,
          options: [
            { value: 'falta_conocimiento', label: 'Falta de conocimiento' },
            { value: 'falta_tiempo', label: 'Falta de tiempo' },
            { value: 'confidencialidad', label: 'Confidencialidad' },
            { value: 'resistencia_cambio', label: 'Resistencia al cambio' },
            { value: 'no_saber_comenzar', label: 'No saber por dónde empezar' },
            { value: 'falta_herramientas', label: 'Falta de herramientas' },
            { value: 'falta_lineamientos', label: 'Falta de lineamientos' },
          ],
        },
        {
          id: 'B18', column: 'team_ai_openness', label: '¿Cómo evaluarías la apertura actual de tu equipo para experimentar con flujos de trabajo con IA?', type: 'single_select', required: true, scoreDimension: 'team_adoption',
          options: [
            { value: 'muy_baja', label: 'Muy baja apertura: existe resistencia clara o poco interés.', score: 1 },
            { value: 'baja', label: 'Baja apertura: hay curiosidad limitada, pero también dudas.', score: 2 },
            { value: 'moderada', label: 'Apertura moderada: algunas personas están interesadas, falta claridad.', score: 3 },
            { value: 'alta', label: 'Alta apertura: el equipo muestra disposición para probar.', score: 4 },
            { value: 'muy_alta', label: 'Muy alta apertura: el equipo está motivado para experimentar y adoptar.', score: 5 },
          ],
        },
        {
          id: 'B19', column: 'share_anonymized_example', label: 'Disposición a compartir posteriormente un ejemplo anonimizado o sin datos sensibles', type: 'single_select', required: true,
          options: [
            { value: 'si', label: 'Sí' },
            { value: 'tal_vez', label: 'Tal vez, previa validación' },
            { value: 'no', label: 'No por ahora' },
          ],
        },
      ],
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry — ordered list for the Designer picker
// ─────────────────────────────────────────────────────────────────────────────

export interface BuiltInTemplate {
  id: string
  name: string
  description: string
  badge: string
  config: SurveyConfigJSON
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'developers',
    name: 'AI Adoption & Leadership Pulse — Desarrolladores',
    description: 'Equipos de desarrollo de software · 24 preguntas · 7 secciones · 9 dimensiones · Scoring completo',
    badge: 'DEV',
    config: TEMPLATE_DEVELOPERS,
  },
  {
    id: 'basic',
    name: 'AI Adoption & Leadership Pulse | Diagnóstico previo (version 1)',
    description: 'Gerentes y directivos · 19 preguntas · 5 secciones · Adaptada para perfiles no técnicos',
    badge: 'EJE',
    config: TEMPLATE_BASIC,
  },
]
