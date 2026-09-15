import {reviewResponseDTO} from "../dto/response/reviewResponseDTO.js";

export const reviewMapper = {
    toResponseDTO(entity) {
        return entity ? new reviewResponseDTO(entity) : null;
    },

    toListResponseDTO(entities) {
        return entities.map(entity => new reviewResponseDTO(entity));
    }
};