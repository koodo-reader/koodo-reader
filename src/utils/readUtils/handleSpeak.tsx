// Gestion de la synthèse vocale et des variables associées
declare var window: any;

// Variables globales
let originalReadingElement: HTMLElement | null = null; // Élément actuellement en lecture
let originalReadingHTML: string | null = null; // HTML original de l'élément actuellement lu
let cancelReading = false; // Indique si une lecture doit être annulée

// Méthode pour arrêter la lecture
export const stopSpeak = () => {
    if (!window.speechSynthesis) {
        console.error("La synthèse vocale n'est pas prise en charge par ce navigateur.");
        return;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        console.log("Lecture en cours ou en attente. Arrêt de la lecture...");
        cancelReading = true; // Indique que la lecture en cours doit être annulée
        window.speechSynthesis.cancel(); // Arrête la synthèse vocale

        // Restaure l'état précédent si nécessaire
        if (originalReadingElement && originalReadingHTML) {
            originalReadingElement.innerHTML = originalReadingHTML;
        }
    } else {
        console.log("Aucune lecture en cours.");
    }
};

// Méthode pour surligner les mots
export const underlinesWords = (
    text: string,
    element: HTMLElement,
    color: string,
    chunkSize: number = 20
) => {
    const words = text.split(" "); // Divise le texte en mots
    console.log("elment ", element)
    const chunks: string[] = [];
    const punctuationRegex = /[.,;:!?]/;

    let currentChunk: string[] = [];

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        currentChunk.push(word);

        if (
            currentChunk.length >= chunkSize ||
            (punctuationRegex.test(word) && currentChunk.length > 1)
        ) {
            chunks.push(currentChunk.join(" "));
            currentChunk = [];
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
    }

    const originalHTML = element.innerHTML; // Sauvegarde l'état original de l'élément
    let currentChunkNumber = 0;
    let wordIndex = 0;
    let lastChunkSize = 0;

    const readChunks = () => {
        console.log("start new reading ");
        if (cancelReading) {
            console.log("Lecture annulée.");
            return; // Arrête la logique de lecture si elle est annulée
        }


        if (currentChunkNumber < chunks.length) {
            const chunk = chunks[currentChunkNumber].split(" ");
            const msg = new SpeechSynthesisUtterance(chunks[currentChunkNumber]);
            msg.lang = "fr-FR";
            msg.rate = 1;
            console.log("liste chunks .", chunks);


            const readWordsInChunk = () => {
                if (cancelReading) {
                    console.log("Lecture annulée.");
                    return; // Arrête la logique de surlignement si elle est annulée
                }

                const fullText = element.textContent || "";
                const wordsArray = fullText.split(" "); // Divise le texte en mots
                const selectedWordsArray = text.split(" "); // Divise le texte sélectionné en mots
                const indexStartSelection = wordsArray.indexOf(selectedWordsArray[0]);
                if (wordIndex < chunk.length) {
                    const highlightedText = fullText
                        .split(" ")
                        .map((word, index) =>
                            index === wordIndex + lastChunkSize + indexStartSelection
                                ? `<span style="background-color: ${color};">${word}</span>` // Surlignement
                                : word
                        )
                        .join(" ");


                    element.innerHTML = highlightedText; // Met à jour le contenu avec surlignement
                    wordIndex++;
                    setTimeout(readWordsInChunk, 250); // Pause entre chaque mot
                } else {
                    lastChunkSize += chunk.length;
                    wordIndex = 0; // Réinitialise l'index des mots
                }
            };


            msg.onend = () => {

                if (cancelReading) {
                    console.log("Lecture annulée.");
                    return; // Arrête la logique de lecture si elle est annulée
                }
                currentChunkNumber++;
                setTimeout(readChunks, 250);
            };


            msg.onerror = (e) => {
                console.error("Erreur lors de la synthèse vocale :", e.error);
            };


            window.speechSynthesis.speak(msg);
            console.log("beforechunk");
            readWordsInChunk(); // Lance la lecture des mots dans le chunk
            console.log("bafter chunk");
        } else {
            console.log("Lecture terminée.");
            element.innerHTML = originalHTML; // Restaure l'état original
        }
    };


    readChunks();
};

export const highlightWordsDirectly = (
    text: string,
    element: HTMLElement,
    color: string,
    delay: number = 250
) => {
    const words = text.split(" "); // Divise le texte en mots
    const originalHTML = element.innerHTML; // Sauvegarde l'état original de l'élément
    let wordIndex = 0; // Index pour parcourir les mots

    const highlightNextWord = () => {
        if (wordIndex < words.length) {
            const fullText = element.textContent || "";
            const wordsArray = fullText.split(" ");
            const selectedWordsArray = text.split(" "); // Divise le texte sélectionné en mots
            const indexStartSelection = wordsArray.indexOf(selectedWordsArray[0]);

            const highlightedText = fullText
                .split(" ")
                .map((word, index) =>
                    index === wordIndex + indexStartSelection
                        ? `<span style="background-color: ${color};">${word}</span>` // Surlignement
                        : word
                )
                .join(" ");

            element.innerHTML = highlightedText; // Met à jour le contenu avec surlignement
            wordIndex++;
            setTimeout(highlightNextWord, delay); // Pause entre chaque mot
        } else {
            element.innerHTML = originalHTML; // Restaure l'état original
            console.log("Surlignement terminé.");
        }
    };

    highlightNextWord();
};


// Exportez également les variables si elles doivent être accessibles dans d'autres fichiers
export { originalReadingElement, originalReadingHTML, cancelReading };