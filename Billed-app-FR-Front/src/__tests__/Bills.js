/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import mockStore from "../__mocks__/store"
import {localStorageMock} from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import userEvent from '@testing-library/user-event'


import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then the button to add next bill should be present", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
    })

  })

  describe('When I click on one icon eye', () => {
    test('A modal should open !', () => {

     // On ajoute artificiellement la méthode modal pour éviter l'erreur "modal is not a function"
      $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));


      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const billsContainer = new Bills({
        document, onNavigate, store, bills, localStorage: window.localStorage
      });

      // Récupérer tous les éléments avec le test id 'icon-eye'
      const eyeIcons = screen.getAllByTestId('icon-eye');
      expect(eyeIcons.length).toBeGreaterThan(0);
      userEvent.click(eyeIcons[0])

      // Appeler directement la méthode en lui passant le premier élément
      billsContainer.handleClickIconEye(eyeIcons[0]);

      // Vérifier que la modale (élément avec data-testid 'modaleFile') est présente
      const modale = screen.getByTestId('modaleFile');
      expect(modale.classList.contains("show")).toBe(true);
    });
  });

// test d'intégration GET
describe("Given I am a user connected as an Employee", () => {
  describe("When I navigate to Bills", () => {
    beforeEach(() => {
      // Configurer le localStorage pour simuler un utilisateur connecté
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      // Créer un conteneur racine et lancer le routeur pour la page Bills
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    });
    test("fetches bills from mock API GET", async () => {
    const billsContainer = new Bills({
      document,
      onNavigate: window.onNavigate,
      store: mockStore,
      bills: bills,
      localStorage: window.localStorage,
    });
    // Appeler la méthode getBills et attendre le résultat
    const result = await billsContainer.getBills();
    // Vérifier que le résultat est un tableau non vide et que chaque facture contient les propriétés formatées attendues
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(bill => {
      expect(bill).toHaveProperty("rawDate");
      expect(bill).toHaveProperty("date");
      expect(bill).toHaveProperty("status");
    });


    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        // Espionner la méthode bills du store pour pouvoir la modifier
        jest.spyOn(mockStore, "bills");
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        // Simuler une erreur 404 dans la méthode list du store
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 404"))
        }));
        const billsContainer = new Bills({
          document,
          onNavigate: window.onNavigate,
          store: mockStore,
          bills: bills,
          localStorage: window.localStorage,
        });
        // Vérifier que l'appel à getBills rejette avec le message d'erreur attendu
        await expect(billsContainer.getBills()).rejects.toThrow("Erreur 404");
      });

      test("fetches bills from an API and fails with 500 message error", async () => {
        // Simuler une erreur 500 dans la méthode list du store
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500"))
        }));
        const billsContainer = new Bills({
          document,
          onNavigate: window.onNavigate,
          store: mockStore,
          bills: bills,
          localStorage: window.localStorage,
        });
        await expect(billsContainer.getBills()).rejects.toThrow("Erreur 500");
      });
    });

  })
})


})
