export namespace database {
	
	export class Chart {
	    id: number;
	    name: string;
	    gender: number;
	    birthYear: number;
	    birthMonth: number;
	    birthDay: number;
	    birthHour: number;
	    calendar: number;
	    chartData: string;
	    notes: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Chart(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.gender = source["gender"];
	        this.birthYear = source["birthYear"];
	        this.birthMonth = source["birthMonth"];
	        this.birthDay = source["birthDay"];
	        this.birthHour = source["birthHour"];
	        this.calendar = source["calendar"];
	        this.chartData = source["chartData"];
	        this.notes = source["notes"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ChartSummary {
	    id: number;
	    name: string;
	    gender: number;
	    birthYear: number;
	    birthMonth: number;
	    birthDay: number;
	    birthHour: number;
	    calendar: number;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ChartSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.gender = source["gender"];
	        this.birthYear = source["birthYear"];
	        this.birthMonth = source["birthMonth"];
	        this.birthDay = source["birthDay"];
	        this.birthHour = source["birthHour"];
	        this.calendar = source["calendar"];
	        this.createdAt = source["createdAt"];
	    }
	}

}

