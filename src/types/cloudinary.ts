import { DeliveryType } from "cloudinary";
import { ImageAndVideoFormatOptions, ResourceType } from "cloudinary";

export interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  format: ImageAndVideoFormatOptions;
  version: number;
  resource_type: ResourceType;
  type: DeliveryType;
  created_at: Date;
  bytes: number;
  width: number;
  height: number;
  folder: string;
  url: string;
  secure_url: string;
  context: {
    custom: {
      category: "mesh" | "image";
      is_free: string | boolean;
      name: string;
    };
  };
  last_updated: Date;
  _isFree: boolean;

}
export interface CloudinaryResponse {
  resources: CloudinaryResource[];
  rate_limit_allowed: number;
  rate_limit_reset_at: Date;
  rate_limit_remaining: number;
}
