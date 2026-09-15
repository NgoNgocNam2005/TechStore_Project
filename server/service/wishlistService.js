import { wishlistRepository } from "../repository/wishlistRepository.js";
import { productRepository } from "../repository/productRepository.js";
import { wishlistMapper } from "../mapper/wishlistMapper.js";
import { AppError } from "../exception/AppError.js";


export const wishlistService = {
    async getMine(userId){
        const items = await wishlistRepository.findByUserId(userId);
        return wishlistMapper.toListResponseDTO(items);
    },

    async add (userId, productId){
        const product = await productRepository.findById(productId);
        if (!product) throw new AppError("Sản phẩm không tồn tại", 404);
        const wishlistItem = await wishlistRepository.add(userId, productId);
        return wishlistMapper.toResponseDTO(wishlistItem);
    },

    async remove (userId, productId){
        const removed = await wishlistRepository.remove(userId, productId);
        if (!removed) throw new AppError("Sản phẩm không tồn tại trong danh sách yêu thích", 404);
    }
};