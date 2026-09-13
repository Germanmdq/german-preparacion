export const patternKeys = ['problem_solution','circumstances','naturalness','checking','inner_conversation','past_revision'] as const;
export type PatternKey = typeof patternKeys[number];
export type Scores = Partial<Record<PatternKey, number>>;
export type QuestionOption = { id: string; text: string; audioSrc: string; duration?: number; scores: Scores };
export type Question = { id: string; text: string; options: QuestionOption[] };

// CONTENIDO PROVISIONAL Y EDITABLE. Sustituir aquí —y solamente aquí— las preguntas definitivas.
const drafts: Array<[string, PatternKey, string[]]> = [
 ['Cuando pensás en eso que querés cambiar, ¿qué aparece primero?', 'problem_solution', ['La situación tal como está y todo lo que falta.','Voy y vuelvo entre el problema y una posible salida.','La dirección que quiero darle, aunque todavía no vea cómo.']],
 ['Después de imaginar que algo salió bien, ¿qué suele pasar?', 'naturalness', ['Se siente ajeno o demasiado difícil de creer.','Lo sostengo un momento, pero pierdo esa sensación.','Puedo quedarme ahí con bastante naturalidad.']],
 ['Si el día empieza mostrando lo contrario de lo que querés, ¿qué cambia adentro tuyo?', 'circumstances', ['Cambia casi todo: mi ánimo y mi expectativa.','Me afecta, aunque después intento volver a centrarme.','Lo noto sin convertirlo en una conclusión.']],
 ['Cuando esperás una respuesta importante, ¿cómo transitás la espera?', 'checking', ['Reviso mensajes o señales una y otra vez.','Compruebo más de lo que me gustaría.','Puedo seguir con mi día sin buscar confirmación.']],
 ['¿Cómo te hablás internamente cuando algo todavía no se resolvió?', 'inner_conversation', ['Repito discusiones, objeciones o escenarios negativos.','Alterno entre alentarme y contradecirme.','Mi conversación suele acompañar lo que quiero construir.']],
 ['Cuando algo parecido salió mal antes, ¿cuánto pesa hoy?', 'past_revision', ['Lo tomo como prueba de que volverá a pasar.','Sé que no determina todo, pero todavía me condiciona.','Puedo reconocerlo sin usarlo para predecir lo próximo.']],
 ['Frente a un problema concreto, ¿dónde pasa más tiempo tu atención?', 'problem_solution', ['En explicar por qué es tan difícil.','En el problema, aunque busco momentos de salida.','En la experiencia que quiero producir ahora.']],
 ['Cuando te permitís una escena favorable, ¿cómo se siente?', 'naturalness', ['Forzada, como si estuviera actuando.','Posible por momentos, pero inestable.','Familiar y suficientemente real.']],
 ['Si alguien hace algo que no esperabas, ¿qué autoridad le das a eso?', 'circumstances', ['Define inmediatamente lo que creo que va a ocurrir.','Me mueve mucho antes de poder reubicarme.','Es un dato, no la decisión final sobre mi experiencia.']],
 ['¿Cuánto buscás indicios de que tu cambio ya empezó?', 'checking', ['Constantemente; necesito encontrarlos.','Bastante, sobre todo cuando dudo.','Poco; no necesito medirlo todo el tiempo.']],
 ['En una conversación imaginaria con alguien importante, ¿qué escuchás?', 'inner_conversation', ['Críticas, rechazo o lo que temo que diga.','Una mezcla entre lo que temo y lo que deseo.','Un intercambio coherente con la relación que quiero.']],
 ['¿Qué hacés mentalmente con una escena pasada que todavía duele?', 'past_revision', ['La repaso tal como ocurrió.','Intento soltarla, pero regreso seguido.','Puedo darle otro sentido y dejar de usarla como prueba.']],
 ['Cuando contás tu situación, ¿qué parte ocupa más espacio?', 'problem_solution', ['Todo lo que está mal y por qué sigue igual.','El problema y también alguna posibilidad.','Lo que estoy eligiendo construir desde ahora.']],
 ['¿Qué tan normal te resulta recibir eso que querés?', 'naturalness', ['Me resulta extraño o improbable.','Puedo concebirlo, pero todavía me sorprende.','Se siente compatible conmigo y con mi vida.']],
 ['Cuando el entorno parece inmóvil, ¿qué pasa con tu decisión?', 'circumstances', ['La abandono o la reemplazo por lo que veo.','Se debilita y necesito recuperarla.','Puede seguir en pie aunque afuera tarde en acompañar.']],
 ['Después de hacer una práctica, ¿qué hacés?', 'checking', ['Voy a comprobar si produjo un cambio.','Trato de no comprobar, pero termino haciéndolo.','Sigo con mi día sin exigir una señal inmediata.']],
 ['Cuando cometés un error, ¿qué frase interna aparece?', 'inner_conversation', ['“Siempre hago lo mismo” o algo parecido.','Me cuestiono bastante antes de aflojar.','Lo corrijo sin convertirlo en una identidad.']],
 ['Si hoy aparece una situación parecida a otra del pasado, ¿qué asumís?', 'past_revision', ['Que tendrá el mismo final.','Temo que se repita, aunque sé que podría cambiar.','Que este momento puede tomar otra dirección.']],
 ['Cuando no sabés el cómo, ¿qué pensamiento domina?', 'problem_solution', ['Enumero obstáculos hasta sentirme sin salida.','Busco soluciones, pero vuelvo seguido a los obstáculos.','Vuelvo a la dirección elegida sin necesitar resolver todo ya.']],
 ['Al imaginar un buen resultado, ¿podés habitarlo o sólo observarlo?', 'naturalness', ['Lo miro de lejos, sin sentirlo propio.','Entro por instantes y enseguida salgo.','Puedo experimentarlo como una posibilidad viva.']],
 ['¿Qué ocurre si alguien te cuenta una noticia desfavorable?', 'circumstances', ['La adopto como verdad sobre mi propio futuro.','Me impacta y después trato de separarla de mi caso.','La escucho sin entregarle mi dirección interna.']],
 ['Cuando no aparece una señal, ¿cómo lo interpretás?', 'checking', ['Como evidencia de que nada está funcionando.','Me inquieta, aunque intento no concluir.','No necesito convertir la ausencia de señal en una respuesta.']],
 ['Antes de dormir, ¿qué conversación queda resonando?', 'inner_conversation', ['La que confirma mis miedos o conflictos.','Depende del día; a veces vuelvo a lo que quiero.','Una que se parece más al desenlace que elijo.']],
 ['Cuando recordás lo que no funcionó, ¿para qué usás ese recuerdo?', 'past_revision', ['Para calcular lo que probablemente vuelva a pasar.','Como advertencia, aunque intento no quedar atado.','Como información que no tiene que gobernar lo próximo.']],
];

// Evita que la respuesta de menor interferencia quede siempre en la misma posición.
// q01 se conserva tal como fue grabada. Para q02-q24 rotamos las tres alternativas.
// Los valores son índices semánticos: 0 = interferencia alta, 1 = media, 2 = baja.
const optionOrders: number[][] = [
 [0,1,2], [2,0,1], [1,2,0], [0,2,1], [2,1,0], [1,0,2],
 [2,0,1], [1,2,0], [0,2,1], [2,1,0], [1,0,2], [0,1,2],
 [1,2,0], [2,0,1], [0,2,1], [1,0,2], [2,1,0], [0,1,2],
 [2,0,1], [0,2,1], [1,0,2], [2,1,0], [1,2,0], [0,1,2],
];

export const questions: Question[] = drafts.map(([text, pattern, answers], index) => {
 const id = `q${String(index + 1).padStart(2,'0')}`;
 const order = optionOrders[index];
 return { id, text, options: order.map((semanticIndex, displayedIndex) => ({
   id: `${id}_${displayedIndex + 1}`,
   text: answers[semanticIndex],
   audioSrc: index * 3 + displayedIndex + 1 <= 23 ? `/audio/respuestas/${index * 3 + displayedIndex + 1}-final.mp3` : '',
   scores: semanticIndex === 0 ? { [pattern]: 3 } : semanticIndex === 1 ? { [pattern]: 1 } : {},
 })) };
});
