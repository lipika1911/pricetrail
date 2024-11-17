"use server"
import axios from 'axios';
import * as cheerio from'cheerio';
import {parsePrice,extractDescription} from '../utils';

export async function scrapeAmazonProduct(url:string){
    if(!url)return;

    //BrightData Proxy Configuration
    const username=String(process.env.BRIGHT_DATA_USERNAME);
    const password=String(process.env.BRIGHT_DATA_PASSWORD);
    const port=22225;
    const session_id=(1000000*Math.random())|0;
    const options={
        auth:{
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }
    try {
        //Fetch the product page or product URL
        const response=await axios.get(url,options);
        const $=cheerio.load(response.data);

        //Extract Product title
        const title=$('#productTitle').text().trim();
        // Extract Price
        const priceWhole = $('.a-price-whole').first().text().trim(); // Use `.first()` to get the first occurrence
        const priceFraction = $('.a-price-fraction').first().text().trim(); // Get fraction if available

        // Combine whole and fraction if present
        const fullPrice = priceFraction ? `${priceWhole}.${priceFraction}` : priceWhole;

        // Convert price to a numeric format
        //current price
        const currentPrice = parsePrice(fullPrice);

        //Original Price
        const mrpText = $('.a-price.a-text-price .a-offscreen').text().trim();
        const mrpCleaned = mrpText.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        const originalPrice = parseInt(mrpCleaned, 10);

        //Availability
        let availability = '';
        const availabilityDiv = $('#availability .a-size-medium.a-color-success, #availability .a-size-base.a-color-price.a-text-bold');
        if (availabilityDiv.length > 0) {
            availability = availabilityDiv.text().trim();
        } else {
            availability = 'Availability information not found';
        }

        //image
        const images=
            $('#imgBlkFront').attr('data-a-dynamic-image')||
            $('#landingImage').attr('data-a-dynamic-image')||
            '{}'
        const imageUrls=Object.keys(JSON.parse(images))

        //currency
        const currency = $('.a-price-symbol').first().text().trim();

        //discount
        const discountRate = $('.a-size-large.a-color-price.savingPriceOverride.aok-align-center.reinventPriceSavingsPercentageMargin.savingsPercentage').text().trim().replace(/[-%]/g,"");

        //description
        const description = extractDescription($)

        //construct data object with scraped information
        const data={
            url,
            currency:currency,
            image: imageUrls[0],
            title,
            currentPrice:Number(currentPrice),
            originalPrice:Number(originalPrice),
            priceHistory:[],
            discountRate:Number(discountRate),
            category:'category',
            reviewsCount:100,
            stars:4.5,
            availability:availability,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }
        return data;
    } catch (error:any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }
}