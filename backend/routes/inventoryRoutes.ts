import { Router } from "express";
import { InventoryController } from "../controllers/inventoryController.ts";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.ts";

export const inventoryRouter = Router();

inventoryRouter.get("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), InventoryController.getItems);
inventoryRouter.get("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer", "Customer"), InventoryController.getItemById);
inventoryRouter.post("/", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), InventoryController.createItem);
inventoryRouter.put("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin", "Engineer"), InventoryController.updateItem);
inventoryRouter.delete("/:id", authenticateJWT, authorizeRoles("Admin", "Super Admin"), InventoryController.deleteItem);
