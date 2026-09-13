import { wishlistService } from "../service/wishlistService.js";

export const wistlistController = {
    async getMine(req, res, next) {
        try {
            const data = await wishlistService.getMine(req.user.id);
            res.json({ success: true, count: data.length, data });
        } catch (error) {
            next(error);
        }
    },

    async add(req, res, next) {
        try {
            const data = await wishlistService.add(req.user.id, req.params.productId);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    async remove(req, res, next) {
        try {
            await wishlistService.remove(req.user.id, req.params.productId);
            res.json({ success: true, message: "Xóa sản phẩm khỏi danh sách yêu thích thành công" });
        } catch (error) {
            next(error);
        }
    }
};