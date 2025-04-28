/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router";
import Store from "../app/Store";
import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Simuler la connexion d'un employé en configurant le localStorage
    Object.defineProperty(window, "location", {
      value: { hash: ROUTES_PATH["NewBill"] },
    });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    // Créer un conteneur racine pour l'application et naviguer vers la page NewBill
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.NewBill);
  });

  describe("When I am on NewBill page", () => {
    test("Then the form should be rendered", () => {
      // Vérifier que le formulaire est présent dans le DOM
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then the email icon in vertical layout should be highlighted", async () => {
      // Attendre que l'icône email soit chargé dans le DOM
      await waitFor(() => screen.getByTestId("icon-mail"));
      const iconMail = screen.getByTestId("icon-mail");
      // S'assurer que l'icône possède la classe indiquant son état actif
      expect(iconMail.classList.contains("active-icon")).toBe(true);
    });
  });

  describe("When I upload a file in a valid format", () => {
    test("Then the input should accept the file", async () => {
      const inputFile = screen.getByTestId("file");
      const validFile = new File(["dummy content"], "valid.png", {
        type: "image/png",
      });

      // Simuler l'upload d'un fichier valide
      userEvent.upload(inputFile, validFile);

      // Vérifier que le fichier est bien présent dans l'input
      expect(inputFile.files).toHaveLength(1);
      expect(inputFile.files[0]).toStrictEqual(validFile);
      // Vérifier que l'extension du fichier correspond à l'un des formats autorisés
      const regexImg = /^.+(\.jpeg|\.jpg|\.png)$/;
      expect(regexImg.test(inputFile.files[0].name)).toBe(true);
    });
  });

  describe("When I upload a file in an invalid format", () => {
    test("Then the upload should fail", () => {
      const fileInput = screen.getByTestId("file");

      // Instancier NewBill avec les dépendances nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        store: Store,
        localStorage: window.localStorage,
      });

      // Espionner l'événement de changement de fichier
      const spyHandleChange = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", spyHandleChange);

      // Simuler la sélection d'un fichier au format incorrect (PDF)
      fireEvent.change(fileInput, {
        target: {
          files: [new File(["image"], "test.pdf", { type: "image/pdf" })],
        },
      });

      // Vérifier que l'upload échoue (input vide)
      expect(fileInput.value).toBe("");
    });

    test("Then an alert should be displayed for an invalid file", () => {
      window.alert = jest.fn();
      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["dummy content"], "invalid.pdf", {
        type: "application/pdf",
      });

      // Simuler la sélection d'un fichier invalide
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      // Vérifier que l'alerte avec le bon message est affichée
      expect(window.alert).toHaveBeenCalledWith(
        "Seuls les fichiers avec les extensions jpg, jpeg ou png sont autorisés."
      );
    });
  });

  describe("When I submit a new Bill on a correct form", () => {
    beforeEach(() => {
      // Réinitialiser le DOM avec le contenu de la page NewBill
      const html = NewBillUI();
      document.body.innerHTML = html;
    });
    test("Then the submit should trigger handleSubmit", () => {
      // Instancier NewBill en lui passant le localStorage configuré
      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });
      // Récupérer le formulaire depuis le DOM
      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();

      // Espionner l'appel de la fonction handleSubmit
      const spySubmit = jest.fn((e) => newBill.handleSubmit(e));
      formNewBill.addEventListener("submit", spySubmit);

      // Simuler la soumission du formulaire
      fireEvent.submit(formNewBill);

      // Vérifier que handleSubmit a bien été appelé
      expect(spySubmit).toHaveBeenCalled();
    });
    test("then verify the submit file", async () => {
      // Instancier NewBill avec un store mocké pour gérer l'upload
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const file = new File(["image"], "image.png", { type: "image/png" });

      // Espionner l'événement de changement de fichier
      const spyFileChange = jest.fn((e) => newBill.handleChangeFile(e));
      const formNewBill = screen.getByTestId("form-new-bill");
      const billFile = screen.getByTestId("file");
      billFile.addEventListener("change", spyFileChange);

      // Simuler l'upload du fichier
      userEvent.upload(billFile, file);

      // Vérifier que le fichier est bien présent dans l'input
      expect(billFile.files[0].name).toBeDefined();
      expect(spyFileChange).toBeCalled();

      // Espionner l'événement de soumission du formulaire
      const spySubmit = jest.fn((e) => newBill.handleSubmit(e));
      formNewBill.addEventListener("submit", spySubmit);

      // Simuler la soumission du formulaire
      fireEvent.submit(formNewBill);
      expect(spySubmit).toHaveBeenCalled();
    });

    test("then submit navigates to Bills page", async () => {
      // Remplacer onNavigate par une fonction espionnable qui met à jour le DOM via ROUTES
      const onNavigateSpy = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      });
      const newBill = new NewBill({
        document,
        onNavigate: onNavigateSpy,
        store: mockStore,
        localStorage: window.localStorage,
      });
      // Simuler l'upload d'un fichier valide
      const file = new File(["image"], "image.png", { type: "image/png" });
      const billFile = screen.getByTestId("file");
      userEvent.upload(billFile, file);

      // Récupérer le formulaire et simuler sa soumission
      const formNewBill = screen.getByTestId("form-new-bill");
      fireEvent.submit(formNewBill);

      // Attendre que la navigation soit déclenchée et vérifier qu'elle se fait vers la page Bills
      await waitFor(() => {
        expect(onNavigateSpy).toHaveBeenCalledWith(ROUTES_PATH.Bills);
      });
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      // Espionner la méthode 'bills' du store mocké
      jest.spyOn(mockStore, "bills");
      // Configurer localStorage pour un employé avec email
      Object.defineProperty(window, "localeStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "employee", email: "a@a" })
      );
    });
    test("Then it should fail with error message 404", async () => {
      // Simuler une erreur 404 en modifiant temporairement la méthode create du store
      mockStore.bills.mockImplementationOnce(() => ({
        create: () => Promise.reject(new Error("Erreur 404")),
      }));
      // Générer l'UI de Bills avec le message d'erreur
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const errorMsg = screen.getByText(/Erreur 404/);
      expect(errorMsg).toBeTruthy();
    });
    test("Then it should fail with error message 500", async () => {
      // Simuler une erreur 500 en modifiant temporairement la méthode create du store
      mockStore.bills.mockImplementationOnce(() => ({
        create: () => Promise.reject(new Error("Erreur 500")),
      }));
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const errorMsg = screen.getByText(/Erreur 500/);
      expect(errorMsg).toBeTruthy();
    });
  });
});
